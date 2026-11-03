// 1) Reemplazá los valores de firebaseConfig por los de tu proyecto Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB0fhv2rUBtmGRrVi09BLVzDyA0_-hoiDQ",
  authDomain: "finanzas-familiar-7f26c.firebaseapp.com",
  projectId: "finanzas-familiar-7f26c",
  storageBucket: "finanzas-familiar-7f26c.firebasestorage.app",
  messagingSenderId: "227913620296",
  appId: "1:227913620296:web:d8337f99e8e99d1e3d717d"
};
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app), provider=new GoogleAuthProvider();
const $=id=>document.getElementById(id);
const categories=["Alquiler","Alimentos","Servicios","Transporte","Combustible","Auto/Seguro/Patente","Salud","Educación","Impuestos","Tarjetas","Préstamos","Entretenimiento","Compras","Hogar","Ahorro","Inversión","Otros"];
let user=null, householdId=null, household=null, allMovements=[];
const money=n=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n||0);
const today=new Date(), monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(s){$("toast").textContent=s;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),3000)}
function monthOptions(){const sel=$("monthSelect");for(let i=0;i<15;i++){const d=new Date(today.getFullYear(),today.getMonth()-i,1),v=monthKey(d),o=document.createElement("option");o.value=v;o.textContent=d.toLocaleDateString("es-AR",{month:"long",year:"numeric"});sel.append(o)}sel.value=monthKey(today)}
async function loadHousehold(){
  const mapRef=doc(db,"userHouseholds",user.uid), mapSnap=await getDoc(mapRef);
  if(mapSnap.exists()){householdId=mapSnap.data().householdId;const h=await getDoc(doc(db,"households",householdId));if(!h.exists())throw Error("No se encontró el hogar.");household=h.data();return}
  // Un usuario nuevo puede crear un hogar propio. Para unirse al hogar existente,
  // el administrador debe agregar primero su Gmail desde la sección Acceso familiar.
  const q=query(collection(db,"households"),where("memberEmails","array-contains",user.email.toLowerCase()));
  const found=await getDocs(q);
  if(!found.empty){const hdoc=found.docs[0];householdId=hdoc.id;household=hdoc.data();await setDoc(mapRef,{householdId,email:user.email.toLowerCase()});return}
  householdId=doc(collection(db,"households")).id;
  household={ownerUid:user.uid,ownerEmail:user.email.toLowerCase(),memberEmails:[user.email.toLowerCase()],createdAt:serverTimestamp()};
  await setDoc(doc(db,"households",householdId),household);
  await setDoc(mapRef,{householdId,email:user.email.toLowerCase()});
}
async function loadData(){
  const q=query(collection(db,"households",householdId,"movements"),orderBy("date","desc"));
  const snap=await getDocs(q);allMovements=snap.docs.map(d=>({id:d.id,...d.data()}));
  render();renderMembers();
}
function render(){
  const month=$("monthSelect").value||monthKey(today), ms=allMovements.filter(x=>(x.date||"").slice(0,7)===month);
  const income=ms.filter(x=>x.type==="Ingreso").reduce((a,x)=>a+Number(x.amount||0),0);
  const expense=ms.filter(x=>x.type==="Gasto").reduce((a,x)=>a+Number(x.amount||0),0);
  $("monthTitle").textContent=new Date(month+"-02").toLocaleDateString("es-AR",{month:"long",year:"numeric"});
  $("income").textContent=money(income);$("expense").textContent=money(expense);$("balance").textContent=money(income-expense);
  const groups={};ms.filter(x=>x.type==="Gasto").forEach(x=>groups[x.category]=(groups[x.category]||0)+Number(x.amount||0));
  const sorted=Object.entries(groups).sort((a,b)=>b[1]-a[1]), max=sorted[0]?.[1]||1;
  $("categories").innerHTML=sorted.length?sorted.slice(0,8).map(([k,v])=>`<div class="barrow"><span>${esc(k)}</span><div class="track"><div class="fill" style="width:${v/max*100}%"></div></div><b>${money(v)}</b></div>`).join(""):'<p class="muted">Todavía no hay gastos registrados para este mes.</p>';
  const alerts=[];
  if(expense>income&&income>0)alerts.push(["warn",`Los gastos superan los ingresos en ${money(expense-income)} este mes.`]);
  if(income>0&&expense/income>.8)alerts.push(["warn",`Ya utilizaste ${Math.round(expense/income*100)}% de tus ingresos del mes.`]);
  if(sorted.length&&income>0&&sorted[0][1]/expense>.35)alerts.push(["warn",`${sorted[0][0]} concentra ${Math.round(sorted[0][1]/expense*100)}% de tus gastos. Revisá si es un gasto excepcional.`]);
  const prev=new Date(month+"-02");prev.setMonth(prev.getMonth()-1);const prevKey=monthKey(prev);
  const prevSpend=allMovements.filter(x=>x.type==="Gasto"&&(x.date||"").slice(0,7)===prevKey).reduce((a,x)=>a+Number(x.amount||0),0);
  if(prevSpend>0&&expense>prevSpend*1.2)alerts.push(["warn",`Tus gastos están ${Math.round((expense/prevSpend-1)*100)}% por encima del mes anterior.`]);
  if(!alerts.length)alerts.push(["good",income?`Buen seguimiento: llevás ${money(Math.max(income-expense,0))} de saldo positivo.`:"Cargá tus movimientos para activar el análisis automático."]);
  $("alerts").innerHTML=alerts.map(([t,s])=>`<div class="alert ${t==="good"?"good":""}">${esc(s)}</div>`).join("");
  $("count").textContent=`${ms.length} movimientos`;
  $("movementList").innerHTML=ms.slice(0,20).map(x=>`<div class="movement"><div><strong>${esc(x.description)}</strong><small>${esc(x.date)} · ${esc(x.category)} · ${esc(x.createdByName||"Integrante")} · ${esc(x.scope||"Familiar")}</small></div><div class="amount ${x.type==="Ingreso"?"in":"out"}">${x.type==="Ingreso"?"+":"−"}${money(x.amount)}</div></div>`).join("")||'<p class="muted">Sin movimientos para este mes.</p>';
}
async function renderMembers(){
  const emails=household?.memberEmails||[];
  $("members").innerHTML=emails.map(e=>`<span class="chip">${esc(e)}${e===household.ownerEmail?" · administrador":""}</span>`).join("");
}
$("login").onclick=async()=>{
  const btn=$("login");
  btn.disabled=true;
  btn.textContent="Conectando con Google…";
  try {
    await signInWithPopup(auth,provider);
  } catch(e) {
    console.error("Error de inicio de sesión:",e);
    toast("No se pudo iniciar sesión: "+(e.code||e.message));
  } finally {
    btn.disabled=false;
    btn.textContent="Continuar con Google";
  }
};
$("logout").onclick=()=>signOut(auth);
$("date").value=new Date().toISOString().slice(0,10);
$("owner").value="";
$("category").innerHTML=categories.map(c=>`<option>${esc(c)}</option>`).join("");
monthOptions();$("monthSelect").onchange=render;
$("movementForm").onsubmit=async e=>{
 e.preventDefault();if(!householdId)return;
 const type=document.querySelector('input[name="type"]:checked').value;
 const amount=Number($("amount").value);if(!(amount>0))return toast("Ingresá un importe válido.");
 await addDoc(collection(db,"households",householdId,"movements"),{type,description:$("description").value.trim(),amount,date:$("date").value,category:$("category").value,scope:$("scope").value,createdBy:user.uid,createdByName:user.displayName||user.email,createdAt:serverTimestamp()});
 $("movementForm").reset();$("date").value=new Date().toISOString().slice(0,10);$("owner").value=user.displayName||user.email;await loadData();toast("Movimiento guardado y compartido.");
};
$("memberForm").onsubmit=async e=>{
 e.preventDefault();if(user.uid!==household.ownerUid)return toast("Solo el administrador puede agregar integrantes.");
 const email=$("memberEmail").value.trim().toLowerCase();if(!email.endsWith("@gmail.com"))return toast("Ingresá una dirección Gmail.");
 const members=[...new Set([...(household.memberEmails||[]),email])];
 await setDoc(doc(db,"households",householdId),{...household,memberEmails:members},{merge:true});household.memberEmails=members;await renderMembers();$("memberEmail").value="";toast("Gmail agregado. La otra persona ya puede iniciar sesión.");
};
onAuthStateChanged(auth,async u=>{
 user=u;
 if(!u){$("loginView").classList.remove("hidden");$("appView").classList.add("hidden");$("logout").classList.add("hidden");return}
 try{
  $("loginView").classList.add("hidden");$("appView").classList.remove("hidden");$("logout").classList.remove("hidden");$("owner").value=u.displayName||u.email;
  await loadHousehold();await loadData();
 }catch(err){console.error(err);toast("No se pudo cargar el hogar: "+err.message)}
});

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));
