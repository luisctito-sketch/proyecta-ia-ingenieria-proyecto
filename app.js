
const $ = id => document.getElementById(id);
const clean = s => (s||"").replace(/\s+/g," ").trim();
const norm = s => clean(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const words = s => norm(s).replace(/[^\p{L}\p{N}\s-]/gu," ").split(/\s+/).filter(Boolean);
const countWords = s => words(s).length;
const esc = s => (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function show(el, cls, html){ el.className=`output-box ${cls}`; el.innerHTML=html; el.classList.remove("hidden"); }
function hasAny(t, arr){ const n=norm(t); return arr.some(x=>n.includes(norm(x))); }
function paragraphs(t){ return (t||"").split(/\n\s*\n/).map(x=>clean(x)).filter(Boolean); }

function detectArea(){
  const selected=$("projectArea").value;
  if(selected!=="auto") return selected;
  const text=[ $("projectTitle").value, $("generalObjective").value, $("specificObjectives").value ].join(" ");
  if(hasAny(text,["electromedic","biomed","bioméd","ecg","electrocard","oximetr","spo2","paciente","fisiolog","signos vitales"])) return "electromed";
  if(hasAny(text,["telecom","iot","internet de las cosas","lora","red","comunicación","comunicacion","inalámbr","inalambr","antena","radiofrecuencia","wifi","mqtt"])) return "telecom";
  if(hasAny(text,["control","automat","pid","plc","actuador","robot","seguidor","manipulador"])) return "control";
  if(hasAny(text,["medición","medicion","instrument","sensor","adquisición","adquisicion","monitor"])) return "instrumentation";
  if(hasAny(text,["robot","móvil","movil","mecatron","servomotor"])) return "robotics";
  return "generic";
}
function areaName(a){
  return ({control:"Control y automatización",telecom:"Telecomunicaciones / IoT",electromed:"Electromedicina",instrumentation:"Instrumentación / Medición",robotics:"Robótica / Mecatrónica",generic:"Sistema electrónico general"})[a]||"Sistema electrónico general";
}
function actionMode(){
  const og=norm($("generalObjective").value);
  if(/^desarrollar\b/.test(og)||/^implementar\b/.test(og)||/^construir\b/.test(og)) return "diseño e implementación";
  if(/^diseñar\b/.test(og)||/^disenar\b/.test(og)) return "diseño (sin obligar implementación física)";
  return "alcance a confirmar según el verbo del Objetivo General";
}
$("analyzeProjectBtn").addEventListener("click",()=>{
  const title=clean($("projectTitle").value), og=clean($("generalObjective").value), oes=clean($("specificObjectives").value);
  const area=detectArea(), place=clean($("targetPlace").value);
  const missing=[];
  if(!title) missing.push("título");
  if(!og) missing.push("Objetivo General");
  if(!oes) missing.push("Objetivos Específicos");
  const coherence = title && og ? (norm(og).includes(norm(title).replace(/^(sistema|prototipo|dispositivo)\s+/,"").slice(0,35)) || norm(title).split(" ").slice(0,5).some(w=>w.length>5 && norm(og).includes(w))) : false;
  show($("projectContextOutput"), missing.length?"warn":"ok",`
    <h4>${missing.length?"🟡 CONTEXTO INCOMPLETO":"🟢 CONTEXTO REGISTRADO"}</h4>
    ${missing.length?`<p>Falta completar: <b>${missing.join(", ")}</b>.</p>`:""}
    <p><b>Área detectada/propuesta:</b> ${areaName(area)}</p>
    <p><b>Alcance inferido por el verbo del Objetivo General:</b> ${actionMode()}.</p>
    <p><b>Entorno declarado:</b> ${place?esc(place):"no indicado"}.</p>
    <p><b>Coherencia temática preliminar título–objetivo:</b> ${coherence?"se detectan términos comunes":"debe comprobarse manualmente; no hay suficiente coincidencia léxica para asegurarlo"}.</p>
    <p class="small">En este módulo los objetivos específicos se utilizan solo para orientar la arquitectura general. Su desarrollo detallado corresponde al siguiente chatbot del Capítulo III.</p>
  `);
});

/* INTRO */
$("reviewIntroBtn").addEventListener("click",()=>{
  const t=clean($("studentIntro").value), el=$("introOutput");
  if(!t){ show(el,"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Pega tu párrafo introductorio.</p>"); return; }
  const wc=countWords(t);
  const checks=[];
  checks.push(wc<=145?["good",`Extensión orientativa adecuada (${wc} palabras).`]:["warn",`Tiene ${wc} palabras y podría superar aproximadamente 10 líneas en Word.`]);
  checks.push(hasAny(t,["capítulo","capitulo","presente capítulo","presente capitulo"])?["good","Se presenta explícitamente el propósito del capítulo."]:["warn","Conviene indicar que el párrafo introduce el contenido del Capítulo III."]);
  checks.push(hasAny(t,["sistema","prototipo","dispositivo","arquitectura"])?["good","Se identifica el objeto técnico que se desarrollará."]:["bad","No se identifica claramente el sistema/prototipo/dispositivo."]);
  checks.push(hasAny(t,["subsistema","arquitectura","bloques","etapas"])?["good","Se anticipa la organización funcional del sistema."]:["warn","Conviene anticipar que se definirá la arquitectura o los subsistemas."]);
  checks.push(hasAny(t,["resultado final","se demostró","se comprobo","se comprobó","se logró"])?["warn","Parece adelantar resultados; el párrafo introductorio debe anunciar el contenido, no concluirlo."]:["good","No se detectan resultados finales adelantados."]);
  const bad=checks.filter(x=>x[0]=="bad").length, warn=checks.filter(x=>x[0]=="warn").length;
  show(el,bad?"bad":warn?"warn":"ok",`<h4>${bad?"🔴 REQUIERE CORRECCIÓN":warn?"🟡 CUMPLE PARCIALMENTE":"🟢 CUMPLE"}</h4><ul>${checks.map(x=>`<li class="status-${x[0]}">${x[1]}</li>`).join("")}</ul><p><b>Cómo mejorarlo:</b> mantén un solo párrafo corto que anuncie definición, arquitectura y subsistemas; no desarrolles todavía cálculos, selección detallada de componentes ni resultados.</p>`);
});

/* DEFINITION */
$("reviewDefinitionBtn").addEventListener("click",()=>{
  const t=clean($("systemDefinition").value), el=$("definitionOutput");
  if(!t){show(el,"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Pega la definición de tu sistema.</p>");return;}
  const wc=countWords(t), og=clean($("generalObjective").value);
  const checks=[];
  checks.push(hasAny(t,["sistema","prototipo","dispositivo","equipo","plataforma","red"])?["good","Se identifica el tipo de solución electrónica."]:["bad","Debe decir claramente qué tipo de sistema/prototipo/dispositivo es."]);
  checks.push(hasAny(t,["medir","monitore","control","proces","comunic","diagn","detect","regular","transmit","visualiz","adquir"])?["good","Se describe al menos una función técnica."]:["bad","No se identifica con claridad qué hace el sistema."]);
  checks.push(hasAny(t,["entrada","sensor","variable","señal","dato","medición","medicion"])?["good","Se reconocen entradas, variables o datos."]:["warn","Conviene indicar qué recibe o mide el sistema."]);
  checks.push(hasAny(t,["salida","actuador","alarma","visualiz","transmit","acción","accion","control"])?["good","Se reconocen salidas, acciones o información entregada."]:["warn","Conviene indicar qué entrega o ejecuta el sistema."]);
  checks.push(hasAny(t,["subsistema","bloque","arquitectura","interconect"])?["good","La definición presenta una visión modular o sistémica."]:["warn","Conviene indicar que el sistema está organizado en subsistemas/bloques interconectados."]);
  if(og) checks.push(hasAny(t,words(og).filter(w=>w.length>6).slice(0,12))?["good","La definición comparte términos técnicos con el Objetivo General."]:["warn","La coherencia con el Objetivo General debe revisarse; se detectan pocas coincidencias temáticas."]);
  checks.push(wc<=220?["good",`La extensión (${wc} palabras) es razonable para una definición breve. `]:["warn",`La definición tiene ${wc} palabras; conviene sintetizar y evitar entrar en diseño detallado.`]);
  const bad=checks.filter(x=>x[0]=="bad").length,warn=checks.filter(x=>x[0]=="warn").length;
  show(el,bad?"bad":warn?"warn":"ok",`<h4>${bad?"🔴 REQUIERE REFORMULACIÓN":warn?"🟡 CUMPLE PARCIALMENTE":"🟢 CUMPLE"}</h4><ul>${checks.map(x=>`<li class="status-${x[0]}">${x[1]}</li>`).join("")}</ul><p><b>Regla:</b> define primero la función global; la selección de componentes, cálculos, modelos, programación y pruebas se desarrollan después.</p>`);
});

/* MODELS */
const models={
  control:[
    ["Subsistema de sensado","Subsistema de procesamiento","Subsistema de control","Subsistema de actuación","Subsistema de supervisión/comunicación","Subsistema de alimentación"],
    ["Subsistema de adquisición","Subsistema de acondicionamiento de señal","Subsistema de procesamiento y control","Subsistema de potencia/actuación","Proceso o planta","Subsistema de realimentación","Subsistema de alimentación"],
    ["Entradas/variables","Unidad de adquisición","Controlador","Etapa de potencia","Actuadores","Interfaz de usuario","Protecciones y alimentación"]
  ],
  telecom:[
    ["Subsistema de adquisición/generación de datos","Nodo de procesamiento","Subsistema de comunicación","Red o gateway","Servidor/nube","Aplicación/visualización","Alimentación"],
    ["Fuente de información","Codificación/procesamiento","Transmisor","Canal de comunicación","Receptor","Procesamiento de recepción","Interfaz de usuario"],
    ["Dispositivo terminal","Interfaz de red","Transceptor","Infraestructura de acceso","Backhaul/red","Servidor/servicio","Supervisión y seguridad"]
  ],
  electromed:[
    ["Subsistema de biosensado","Acondicionamiento de señal","Adquisición y conversión","Procesamiento","Visualización y alarmas","Comunicación/registro","Alimentación y protección"],
    ["Paciente/señal fisiológica","Sensor/electrodo","Etapa analógica","ADC","Procesamiento digital","Interfaz clínica","Registro/transmisión","Seguridad eléctrica"],
    ["Adquisición biomédica","Filtrado y acondicionamiento","Procesamiento de parámetros","Detección de eventos","Interfaz de usuario","Almacenamiento/comunicación","Gestión energética"]
  ],
  instrumentation:[
    ["Subsistema de sensado","Acondicionamiento","Conversión A/D","Procesamiento","Visualización/registro","Comunicación","Alimentación"],
    ["Magnitud física","Transductor","Etapa analógica","Adquisición digital","Procesamiento","Interfaz de usuario","Protección y alimentación"],
    ["Entrada de medición","Adaptación de señal","Unidad de adquisición","Cálculo/estimación","Registro","Salida/visualización"]
  ],
  robotics:[
    ["Sensado/percepción","Procesamiento","Planificación/control","Actuación","Estructura mecánica","Comunicación/supervisión","Alimentación"],
    ["Entradas/sensores","Controlador embebido","Lógica de decisión","Drivers de potencia","Motores/servos","Realimentación","Interfaz de usuario"],
    ["Percepción","Estimación de estado","Control de movimiento","Actuación","Mecánica","Seguridad","Energía"]
  ],
  generic:[
    ["Subsistema de entrada/adquisición","Subsistema de procesamiento","Subsistema de salida/actuación","Subsistema de comunicación/interfaz","Subsistema de alimentación"],
    ["Entradas","Acondicionamiento","Procesamiento","Salidas","Supervisión","Protecciones"],
    ["Adquisición","Procesamiento","Decisión o transformación","Entrega de información/acción","Alimentación"]
  ]
};
$("generateSubsystemsBtn").addEventListener("click",()=>{
  const area=detectArea(), sets=models[area]||models.generic;
  const html=sets.map((set,i)=>`<article class="architecture-model"><h5>MODELO ${String.fromCharCode(65+i)} · ${i==0?"BASE":i==1?"AMPLIADO":"ALTERNATIVO"}</h5><ul>${set.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><p class="small">Adapta, elimina o añade bloques según tu proyecto.</p></article>`).join("");
  show($("subsystemModelsOutput"),"ok",`<h4>🟢 Modelos tentativos para ${areaName(area)}</h4><p>No constituyen el índice definitivo ni obligan a utilizar todos los bloques.</p><div class="model-columns">${html}</div>`);
});
$("reviewSubsystemListBtn").addEventListener("click",()=>{
  const t=clean($("studentSubsystemList").value), el=$("subsystemListOutput");
  if(!t){show(el,"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Escribe tu lista de subsistemas.</p>");return;}
  const items=t.split(/[;\n]+/).map(x=>clean(x)).filter(Boolean);
  const area=detectArea(), n=norm(t), checks=[];
  checks.push(items.length>=3?["good",`Se identifican ${items.length} bloques/subsistemas.`]:["warn","Se identifican pocos bloques; comprueba que la arquitectura realmente esté completa."]);
  checks.push(items.every(x=>x.length>3)?["good","Los bloques tienen nombres identificables."]:["warn","Hay nombres demasiado cortos o ambiguos."]);
  checks.push(items.some(x=>/subsistema|entrada|salida|unidad|interfaz|etapa|aliment|proces|sens|comunic|actua/i.test(x))?["good","Se utilizan denominaciones funcionales."]:["warn","Conviene nombrar los bloques por su función, no solo por marca/modelo de componente."]);
  if(["control","instrumentation","electromed","robotics"].includes(area)) checks.push(hasAny(t,["aliment","energ","fuente"])?["good","Se considera alimentación/energía."]:["warn","Revisa si corresponde representar el subsistema de alimentación."]);
  if(area=="control") checks.push(hasAny(t,["actua","salida","potencia"])?["good","Se considera actuación/salida."]:["warn","En control/automatización normalmente debe existir actuación o una salida física claramente identificada."]);
  if(area=="telecom") checks.push(hasAny(t,["comunic","red","transmis","transceptor","gateway"])?["good","Se considera la cadena de comunicación."]:["bad","En telecomunicaciones debe quedar clara la cadena de transmisión/comunicación."]);
  const bad=checks.filter(x=>x[0]=="bad").length,warn=checks.filter(x=>x[0]=="warn").length;
  show(el,bad?"bad":warn?"warn":"ok",`<h4>${bad?"🔴 REVISAR ARQUITECTURA":warn?"🟡 CUMPLE PARCIALMENTE":"🟢 ESTRUCTURA COHERENTE"}</h4><ul>${checks.map(x=>`<li class="status-${x[0]}">${x[1]}</li>`).join("")}</ul>`);
});

/* SVG DOWNLOAD */
document.querySelectorAll(".download-svg").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const svg=document.getElementById(btn.dataset.svg);
    const data='<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(svg);
    const blob=new Blob([data],{type:"image/svg+xml;charset=utf-8"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=btn.dataset.name; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),500);
  });
});

/* IMAGE PREVIEW */
let uploadedImageInfo=null;
$("systemImage").addEventListener("change",()=>{
  const file=$("systemImage").files[0];
  if(!file){uploadedImageInfo=null;$("imagePreviewWrap").classList.add("hidden");$("imageMeta").textContent="";return;}
  const url=URL.createObjectURL(file);
  $("imagePreview").src=url;$("imagePreviewWrap").classList.remove("hidden");
  const img=new Image();
  img.onload=()=>{
    uploadedImageInfo={name:file.name,type:file.type,size:file.size,width:img.width,height:img.height};
    $("imageMeta").textContent=`${file.name} · ${(file.size/1024).toFixed(1)} KB · ${img.width}×${img.height}px`;
  };
  img.src=url;
});
$("reviewImageBtn").addEventListener("click",()=>{
  const el=$("imageReviewOutput"),desc=clean($("imageDescription").value);
  if(!uploadedImageInfo){show(el,"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Selecciona primero la imagen de tu sistema.</p>");return;}
  const checked=[...document.querySelectorAll(".diagram-check:checked")].map(x=>x.value);
  const checks=[];
  checks.push(uploadedImageInfo.width>=700?["good","La resolución horizontal permite una lectura razonable en documento."]:["warn","La imagen podría quedar pixelada; conviene usar mayor resolución o formato vectorial SVG."]);
  checks.push(uploadedImageInfo.width>uploadedImageInfo.height?["good","La orientación horizontal suele ser adecuada para diagramas de bloques."]:["warn","Revisa si la orientación elegida permite leer claramente todos los bloques."]);
  checks.push(desc.length>40?["good","Se proporcionó una descripción textual de la figura."]:["warn","Describe los bloques y flechas para facilitar la revisión metodológica."]);
  checks.push(checked.includes("subsistemas")?["good","Declaras que los subsistemas están identificados."]:["bad","Marca o corrige la identificación de los subsistemas."]);
  checks.push(checked.includes("flechas")?["good","Declaras que existe dirección de flujo."]:["warn","Las flechas deben mostrar con claridad cómo circulan señales o información."]);
  checks.push(checked.includes("titulo")?["good","Declaras número, título y fuente."]:["bad","Falta confirmar número de figura, título y fuente."]);
  const bad=checks.filter(x=>x[0]=="bad").length,warn=checks.filter(x=>x[0]=="warn").length;
  show(el,bad?"bad":warn?"warn":"ok",`<h4>${bad?"🔴 REQUIERE AJUSTES":warn?"🟡 REVISIÓN BÁSICA PARCIAL":"🟢 REVISIÓN BÁSICA FAVORABLE"}</h4><ul>${checks.map(x=>`<li class="status-${x[0]}">${x[1]}</li>`).join("")}</ul><p class="small">Esta revisión local no interpreta automáticamente el contenido visual píxel por píxel. Para análisis visual profundo, adjunta la imagen en ChatGPT y usa el prompt preparado.</p>`);
});
function visualPrompt(){
  return `ACTÚA COMO REVISOR METODOLÓGICO Y DE INGENIERÍA ELECTRÓNICA PARA EL CAPÍTULO III. INGENIERÍA DEL PROYECTO.

REVISA ÚNICAMENTE LA FIGURA GENERAL DEL SISTEMA Y SU COHERENCIA CON EL TÍTULO Y OBJETIVO GENERAL. NO DESARROLLES LOS OBJETIVOS ESPECÍFICOS.

TÍTULO:
${$("projectTitle").value.trim()||"[NO INGRESADO]"}

OBJETIVO GENERAL:
${$("generalObjective").value.trim()||"[NO INGRESADO]"}

OBJETIVOS ESPECÍFICOS (SOLO CONTEXTO):
${$("specificObjectives").value.trim()||"[NO INGRESADOS]"}

DESCRIPCIÓN QUE HACE EL ESTUDIANTE DE SU FIGURA:
${$("imageDescription").value.trim()||"[NO INGRESADA]"}

INSTRUCCIONES:
1. Observa la imagen adjunta.
2. Comprueba si representa el sistema completo a nivel funcional.
3. Verifica si los bloques están nombrados como funciones o subsistemas y no solamente como marcas/modelos.
4. Revisa entradas, procesamiento, salidas, actuación, comunicación/supervisión, alimentación y realimentación cuando correspondan.
5. Comprueba dirección y coherencia de las flechas.
6. Comprueba si la figura coincide con el Objetivo General.
7. Señala bloques faltantes, redundantes o mal ubicados.
8. Revisa que exista número, título de figura y fuente.
9. No inventes componentes ni modifiques el objetivo del estudiante.
10. Si propones mejoras, entrega 2 o 3 MODELOS DE ARQUITECTURA posibles para que el estudiante elija y adapte, sin imponer uno como definitivo.

RESPONDE CON:
A. DICTAMEN: CUMPLE / CUMPLE PARCIALMENTE / REQUIERE REFORMULACIÓN / FALTA INFORMACIÓN.
B. FORTALEZAS DE LA FIGURA.
C. QUÉ FALTA Y POR QUÉ.
D. CÓMO MEJORARLA.
E. COHERENCIA CON EL OBJETIVO GENERAL.
F. MODELOS ALTERNATIVOS DE BLOQUES (solo si son necesarios).`;
}
$("copyVisualPromptBtn").addEventListener("click",async()=>{
  await navigator.clipboard.writeText(visualPrompt());
  alert("Prompt de revisión visual copiado. Adjunta tu imagen en ChatGPT junto con el prompt.");
});

/* SUBSYSTEM TEXT */
$("reviewSubsystemTextBtn").addEventListener("click",()=>{
  const t=$("subsystemDescription").value.trim(), el=$("subsystemTextOutput");
  if(!t){show(el,"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Pega la descripción de tus subsistemas.</p>");return;}
  const ps=paragraphs(t), total=countWords(t), bulletLines=(t.match(/(^|\n)\s*[-•*]\s+/g)||[]).length;
  const checks=[];
  checks.push(ps.length>=1?["good",`Se detectan ${ps.length} párrafo(s).`]:["bad","No se detecta redacción en párrafos."]);
  checks.push(ps.every(p=>countWords(p)<=145)?["good","No se detectan párrafos claramente excesivos por número de palabras."]:["warn","Uno o más párrafos podrían superar aproximadamente 10 líneas."]);
  checks.push(hasAny(t,["se encarga","permite","corresponde","constituye","su función","su funcion","recibe","procesa","entrega","transmite","convierte","ejecuta"])?["good","La redacción explica funciones de los subsistemas."]:["warn","Conviene explicar qué hace cada subsistema, no solo enumerar componentes."]);
  checks.push(hasAny(t,["además","asimismo","por tanto","por consiguiente","de esta manera","en consecuencia","posteriormente","finalmente","a su vez"])?["good","Se detecta uso de conectores gramaticales."]:["warn","Incorpora conectores para dar continuidad científica a la explicación."]);
  checks.push(bulletLines<=3?["good",bulletLines?`Las viñetas son limitadas (${bulletLines}); comprueba que solo enumeren características.`:"No se detecta abuso de viñetas."]:["warn",`Se detectan ${bulletLines} viñetas; el cuerpo principal debe redactarse preferentemente en párrafos.`]);
  checks.push(/\b(yo|nosotros|mi|nuestro|hicimos|realicé|realice)\b/i.test(t)?["warn","Se detecta primera persona; revisa la forma científica/impersonal."]:["good","No se detecta primera persona evidente."]);
  const warn=checks.filter(x=>x[0]=="warn").length,bad=checks.filter(x=>x[0]=="bad").length;
  show(el,bad?"bad":warn?"warn":"ok",`<h4>${bad?"🔴 NO CUMPLE":warn?"🟡 CUMPLE PARCIALMENTE":"🟢 CUMPLE"}</h4><ul>${checks.map(x=>`<li class="status-${x[0]}">${x[1]}</li>`).join("")}</ul><p><b>Orientación:</b> cada párrafo debe explicar función, entrada, tratamiento/salida y relación con el sistema. Los componentes concretos pueden mencionarse brevemente, pero su selección y cálculo pertenecen al desarrollo detallado posterior.</p>`);
});

/* FULL REVIEW */
function row(name,status,detail){
  const cls=status==="CUMPLE"?"good":status==="NO CUMPLE"?"bad":"warn";
  return `<tr><td>${name}</td><td class="status-${cls}">${status}</td><td>${detail}</td></tr>`;
}
$("runFullReviewBtn").addEventListener("click",()=>{
  const title=clean($("projectTitle").value),og=clean($("generalObjective").value),intro=clean($("studentIntro").value),
  def=clean($("systemDefinition").value),subs=clean($("studentSubsystemList").value),desc=clean($("subsystemDescription").value);
  const rows=[];
  rows.push(row("Título y Objetivo General",title&&og?"CUMPLE":"FALTA INFORMACIÓN",title&&og?"Datos disponibles para revisar coherencia.":"Debes ingresar ambos datos."));
  rows.push(row("Párrafo introductorio",intro?(countWords(intro)<=145?"CUMPLE":"CUMPLE PARCIALMENTE"):"NO CUMPLE",intro?"Existe párrafo introductorio; verifica extensión y que no adelante resultados.":"Falta el párrafo después del título del capítulo."));
  rows.push(row("Definición del sistema",def?(hasAny(def,["sistema","prototipo","dispositivo","plataforma"])? "CUMPLE":"CUMPLE PARCIALMENTE"):"NO CUMPLE",def?"Existe definición; comprueba entradas, función y salidas.":"Falta definir el sistema global."));
  rows.push(row("Subsistemas principales",subs?(subs.split(/[;\n]+/).filter(x=>clean(x)).length>=3?"CUMPLE":"CUMPLE PARCIALMENTE"):"NO CUMPLE",subs?"Existe propuesta de bloques funcionales.":"Falta identificar los subsistemas."));
  rows.push(row("Figura general",uploadedImageInfo?"CUMPLE PARCIALMENTE":"NO CUMPLE",uploadedImageInfo?"La figura fue cargada; necesita comprobarse visualmente y confirmar título/fuente.":"Falta cargar o preparar la figura general del sistema."));
  rows.push(row("Descripción breve de subsistemas",desc?"CUMPLE":"NO CUMPLE",desc?"Existe redacción para revisar antes del desarrollo detallado.":"Falta describir brevemente la función de cada subsistema."));
  const fail=rows.filter(x=>x.includes("NO CUMPLE")).length;
  show($("fullReviewOutput"),fail?"warn":"ok",`
    <h4>${fail?"🟡 CAPÍTULO III AÚN INCOMPLETO":"🟢 BASE DEL CAPÍTULO III ORGANIZADA"}</h4>
    <table class="review-table"><thead><tr><th>Criterio</th><th>Dictamen</th><th>Observación</th></tr></thead><tbody>${rows.join("")}</tbody></table>
    <p><b>Siguiente etapa:</b> una vez consolidada esta arquitectura general, el siguiente chatbot podrá desarrollar secuencialmente los objetivos específicos mediante cálculos, diseño, selección, modelado, simulación, programación e implementación según corresponda.</p>
  `);
});

/* DEEP PROMPT */
function deepPrompt(){
  return `ACTÚA COMO REVISOR METODOLÓGICO Y ACADÉMICO DEL CAPÍTULO III. INGENIERÍA DEL PROYECTO (MARCO PRÁCTICO) EN UN PROYECTO DE GRADO DE INGENIERÍA ELECTRÓNICA.

ALCANCE DE ESTA REVISIÓN:
Revisa SOLO la entrada general del Capítulo III:
- párrafo introductorio;
- definición del sistema;
- arquitectura general;
- identificación de subsistemas;
- coherencia de la figura general;
- descripción breve de cada subsistema;
- diferenciación hardware, software y firmware.
NO desarrolles todavía los objetivos específicos ni redactes el capítulo completo por el estudiante.

TÍTULO:
${$("projectTitle").value.trim()||"[NO INGRESADO]"}

OBJETIVO GENERAL:
${$("generalObjective").value.trim()||"[NO INGRESADO]"}

OBJETIVOS ESPECÍFICOS (SOLO PARA COMPROBAR COHERENCIA):
${$("specificObjectives").value.trim()||"[NO INGRESADOS]"}

DESTINO / ENTORNO:
${$("targetPlace").value.trim()||"[NO INDICADO]"}

PÁRRAFO INTRODUCTORIO:
${$("studentIntro").value.trim()||"[NO INGRESADO]"}

DEFINICIÓN DEL SISTEMA:
${$("systemDefinition").value.trim()||"[NO INGRESADA]"}

SUBSISTEMAS PROPUESTOS:
${$("studentSubsystemList").value.trim()||"[NO INGRESADOS]"}

DESCRIPCIÓN DE LOS SUBSISTEMAS:
${$("subsystemDescription").value.trim()||"[NO INGRESADA]"}

DESCRIPCIÓN DE LA FIGURA:
${$("imageDescription").value.trim()||"[NO INGRESADA]"}

CRITERIOS:
1. Después del título CAPÍTULO III debe existir un párrafo introductorio corto.
2. La definición del sistema debe indicar qué es, para qué sirve, entradas, procesamiento/función, salidas y entorno.
3. La arquitectura debe dividir el sistema en subsistemas funcionales coherentes con el Objetivo General.
4. La figura general debe mostrar relaciones y flujo mediante flechas, además de alimentación y realimentación cuando corresponda.
5. Cada subsistema debe describirse brevemente con redacción científica: función, entradas, tratamiento/salida y relación con otros bloques.
6. No convertir esta sección inicial en un catálogo de componentes.
7. Diferenciar hardware, software y firmware. Firmware es el software embebido que ejecuta la lógica sobre el hardware.
8. Usar viñetas solo cuando sea necesario enumerar características, requisitos o parámetros; el cuerpo principal debe ir en párrafos.
9. Mantener párrafos de máximo aproximado de 10 líneas en hoja carta, Times New Roman 12 e interlineado 1,5.
10. No inventar componentes, especificaciones, fuentes, datos, resultados ni diagramas.
11. Si faltan datos, indicar FALTA INFORMACIÓN.
12. Si el estudiante solicita ayuda para la arquitectura, ofrecer 2 o 3 MODELOS de subsistemas para que él elija y adapte.
13. No redactar el desarrollo de los objetivos específicos todavía.

RESPONDE CON:
1. DICTAMEN GENERAL.
2. A. FORTALEZAS.
3. B. INFORMACIÓN QUE FALTA Y CÓMO MEJORARLA.
4. C. ERRORES O INCONSISTENCIAS.
5. D. COHERENCIA CON TÍTULO Y OBJETIVO GENERAL.
6. E. REVISIÓN DEL PÁRRAFO INTRODUCTORIO.
7. F. REVISIÓN DE LA DEFINICIÓN DEL SISTEMA.
8. G. REVISIÓN DE SUBSISTEMAS.
9. H. REVISIÓN DE LA FIGURA (si se adjunta imagen).
10. I. HARDWARE / SOFTWARE / FIRMWARE.
11. J. RECOMENDACIONES CONCRETAS.
12. Si hace falta, 2 o 3 modelos de arquitectura funcional; nunca un único modelo obligatorio.`;
}
$("copyDeepPromptBtn").addEventListener("click",async()=>{
  await navigator.clipboard.writeText(deepPrompt());
  $("deepPromptStatus").textContent="Prompt completo copiado.";
});
