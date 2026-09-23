/* WHITEOUT ID — gunung prosedural 3D + cuaca + climb effect */
(function(){
'use strict';
var PI=Math.PI, clamp=function(v,a,b){return v<a?a:v>b?b:v}, lerp=function(a,b,t){return a+(b-a)*t};
var sat=function(v){return v<0?0:v>1?1:v}, smooth=function(a,b,x){var t=sat((x-a)/(b-a));return t*t*(3-2*t)};

/* ---------- DATA (bilingual) ---------- */
var LANG='id';
var I18N={
 id:{
  unit:'Meter',hint:'Scroll untuk mendaki',descend:'Turun',soundOn:'Angin On',soundOff:'Angin Off',
  subs:['Sebelum Gunung','Labirin Bergerak','Lembah Sunyi','Di Atas Awan','Di Atas 8.000 M','Puncak Dunia'],
  paras:[
   'Ketinggian terakhir di mana tubuh masih setuju. Tenda, tali, oksigen, dan dinding es raksasa di atas moraine.',
   'Gletser berjalan satu meter sehari. Serac, crevasse, dan tangga aluminium. Seberangi sebelum ia sadar.',
   'Di atas icefall dunia terbuka jadi baskom putih datar. Tak ada angin. Hanya cahaya dan napasmu sendiri.',
   'Es biru 50 derajat. Satu fixed-line dari anchor ke anchor, cuaca badai jauh di bawah sepatumu.',
   'Batu gelap, salju keras, bintang. Tak ada yang hidup di sini. Kamu hanya meminjam waktu.',
   'Matahari terbit di lautan awan. Semua gunung lain di bumi ada di bawahmu. Tak ada lagi ke atas.'],
  w:['Salju ringan — Basecamp','Serac aktif — Icefall','Silau putih — Cwm','Badai di bawah — Face','Death zone — di atas 8.000 m','Sunrise — Summit 8.849 m'],
  autoWarn:'⚠ Otomatis jalan dalam {s} dtk — sentuh untuk batal',
  autoOn:'⏵ Auto-gerak aktif — sentuh untuk ambil alih'
 },
 en:{
  unit:'Metres',hint:'Scroll to climb',descend:'Descend',soundOn:'Wind On',soundOff:'Wind Off',
  subs:['Before the Mountain','The Moving Labyrinth','Valley of Silence','Above the Clouds','Above 8,000 M','Top of the World'],
  paras:[
   '5,364 metres. The last altitude where the body still agrees. Tents, rope, oxygen, and a wall of ice above the moraine.',
   'The glacier walks downhill a metre a day. Seracs, crevasses and ladders. Cross before it notices you.',
   'Above the icefall the world opens into a flat white basin. No wind. Only light and your own lungs.',
   'Blue ice at fifty degrees. A single fixed line, anchor to anchor, weather far below your boots.',
   'Dark rock, hard snow, stars. Nothing lives here. You are only borrowing time.',
   '8,849 metres. Sunrise on a sea of cloud, every other mountain beneath you. Nothing above.'],
  w:['Light snow — Base Camp','Active seracs — Icefall','White glare — Cwm','Storm below — Face','Death zone — above 8,000 m','Sunrise — Summit 8,849 m'],
  autoWarn:'⚠ Auto-walk in {s}s — touch to cancel',
  autoOn:'⏵ Auto-move active — touch to take over'
 }
};
var CHAPTERS=[
 {n:'00',t:'Basecamp',alt:5364,sky:0x1a4fd6,sky2:0x0a1a3a,fog:0x8fb6f5,sun:0xffffff,sunI:.85,snow:.35,wind:4, icon:'❄',w:'Salju ringan — Basecamp'},
 {n:'01',t:'Icefall', alt:5520,sky:0x578EF5,sky2:0x123a9e,fog:0xa9c8f7,sun:0xeaf2ff,sunI:.9, snow:.8, wind:14,icon:'◈',w:'Serac aktif — Icefall'},
 {n:'02',t:'Cwm',     alt:6800,sky:0x65D0F4,sky2:0x2373F4,fog:0xcdeefb,sun:0xffffff,sunI:1.15,snow:.12,wind:3, icon:'☀',w:'Silau putih — Cwm'},
 {n:'03',t:'Face',    alt:7950,sky:0x2b3f66,sky2:0x101c38,fog:0x7e93b8,sun:0xbfd4ff,sunI:.6, snow:.95,wind:30,icon:'≋',w:'Badai di bawah — Face'},
 {n:'04',t:'8K Zone', alt:8720,sky:0x060b22,sky2:0x02040c,fog:0x1a2340,sun:0x8fa8ff,sunI:.35,snow:.6, wind:38,icon:'★',w:'Death zone — di atas 8.000 m'},
 {n:'05',t:'Summit',  alt:8849,sky:0x65D0F4,sky2:0xF2F7A0,fog:0xf6efb8,sun:0xF2F7A0,sunI:1.5,snow:.2, wind:8, icon:'✺',w:'Sunrise — Summit 8.849 m'}
];
var ALT_M=[5364,5520,6100,6800,7950,8720,8849];

/* ---------- NOISE ---------- */
function hash(x,y){var s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);}
function vnoise(x,y){
  var xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  var u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  var a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);
  return (a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v)*2-1;
}
function fbm(x,y,oct){var s=0,a=1,f=1,n=0;for(var i=0;i<oct;i++){s+=a*vnoise(x*f+i*13.7,y*f-i*7.1);n+=a;a*=.5;f*=2.03;}return s/n;}
function ridge(x,y,oct){var s=0,a=1,f=1,n=0;for(var i=0;i<oct;i++){s+=a*(1-Math.abs(vnoise(x*f,y*f)));n+=a;a*=.52;f*=2.07;}return s/n*2-1;}

/* ---------- ROUTE ---------- */
var WP=[
 [-976,112,-318],[-898,117,-298],[-812,128,-276],[-754,141,-264],
 [-690,163,-256],[-616,224,-258],[-558,280,-261],[-494,331,-256],[-424,371,-258],
 [-374,385,-256],[-234,409,-250],[-66,437,-256],[106,465,-256],
 [166,485,-252],[234,565,-222],[276,657,-190],[294,757,-138],
 [272,789,-102],[220,821,-84],[162,849,-64],[100,871,-45],[44,890,-26],[0,936,0]
];
var curve=new THREE.CatmullRomCurve3(WP.map(function(w){return new THREE.Vector3(w[0],w[1],w[2]);}),false,'catmullrom',.5);
curve.arcLengthDivisions=4000;
var RN=500, RS=[];
(function(){for(var i=0;i<RN;i++){var u=i/(RN-1);var p=curve.getPointAt(u);RS.push(p);}})();
function nearestRouteY(x,z){
  var bi=0,bd=1e18;
  for(var i=0;i<RN;i+=2){var dx=RS[i].x-x,dz=RS[i].z-z;var d=dx*dx+dz*dz;if(d<bd){bd=d;bi=i;}}
  var best=bi,bd2=bd;
  for(var k=Math.max(0,bi-2);k<=Math.min(RN-1,bi+2);k++){var dx2=RS[k].x-x,dz2=RS[k].z-z;var d2=dx2*dx2+dz2*dz2;if(d2<bd2){bd2=d2;best=k;}}
  return {d:Math.sqrt(bd2),y:RS[best].y,i:best};
}

/* ridge segments utk massa gunung */
var RIDGE=[
 [[430,-210],[300,-124],[120,-50],[0,0],[700,934,112]],
 [[0,0],[-200,80],[-470,300],[-640,470],[934,640,320]],
 [[0,0],[70,250],[190,640],[934,580,420]],
 [[-430,-206],[-60,-160],[300,-196],[560,620,644]],
 [[-700,-560],[-120,-520],[430,-476],[560,665,540]]
];
function segD(px,pz,ax,az,bx,bz){var dx=bx-ax,dz=bz-az;var l2=dx*dx+dz*dz;var t=l2>0?((px-ax)*dx+(pz-az)*dz)/l2:0;t=clamp(t,0,1);var cx=ax+dx*t-px,cz=az+dz*t-pz;return{d:Math.sqrt(cx*cx+cz*cz),t:t};}

function terrainBase(x,z){
  var r=Math.sqrt(x*x+z*z);
  var h=640*Math.pow(sat(1-r/1180),1.55);
  var crest=0;
  for(var ri=0;ri<RIDGE.length;ri++){
    var R=RIDGE[ri],H=R[R.length-1];
    for(var i=0;i<R.length-2;i++){
      var s=segD(x,z,R[i][0],R[i][1],R[i+1][0],R[i+1][1]);
      var w=170, hh=lerp(H[i],H[i+1],s.t);
      if(s.d>w*3)continue;
      var f=Math.exp(-Math.pow(s.d/w,1.7));
      var v=hh*f;
      if(v>h)h=v;
      if(f>crest)crest=f;
    }
  }
  var sh=smooth(1180,620,r);
  var wx=x+78*fbm(x*.00135+11.3,z*.00135-7.1,2),wz=z+78*fbm(x*.00135-4.7,z*.00135+9.6,2);
  /* 6 oktaf: relief besar + punggungan tajam + detail mikro sastrugi */
  var n=21*fbm(x*.00215,z*.00215,6)+11*ridge(wx*.0062,wz*.0062,4)*(.35+.65*sh)+5*ridge(wx*.0031+40,wz*.0031-22,3)*(.25+.75*sh)+3*fbm(x*.0125,z*.0125,3)+1.2*fbm(x*.045,z*.045,2);
  h+=n*(.55+.45*sh)*(1-.55*crest)*(1-.55*smooth(230,30,r));
  return h;
}
function heightAt(x,z){
  var h=terrainBase(x,z);
  var q=nearestRouteY(x,z);
  var br=90;
  if(q.d<br){var w=smooth(br,br*.14,q.d);h=lerp(h,q.y-1.2,w);}
  h+=(3.4*fbm(x*.031,z*.031,3)+1.1*fbm(x*.092,z*.092,2))*.5;
  /* icefall chop */
  var iu=q.i/(RN-1);
  var band=smooth(.12,.2,iu)*(1-smooth(.34,.42,iu));
  if(band>0)h+=band*(ridge(x*.0265,z*.0265,3)*8+ridge(x*.072,z*.072,2)*3)*smooth(8,40,q.d);
  /* crevasse slots */
  h-=14*Math.exp(-Math.pow(Math.abs(z+340)/7,2))*smooth(.1,.2,iu)*(1-smooth(.4,.5,iu));
  /* summit rock */
  if(h>800)h-=smooth(800,936,h)*10*fbm(x*.05,z*.05,2);
  return h;
}

/* ---------- RENDERER / SCENE ---------- */
var canvas=document.getElementById('gl'), scrollEl=document.getElementById('scroll');
var renderer;
try{renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true});}
catch(e){document.getElementById('bootS').textContent='WebGL tidak tersedia';return;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;

var scene=new THREE.Scene();
scene.background=new THREE.Color(0x1a4fd6);
scene.fog=new THREE.Fog(0x8fb6f5,200,2400);
var camera=new THREE.PerspectiveCamera(58,window.innerWidth/window.innerHeight,.5,9000);

/* sky dome gradient: #2373F4 atas -> horizon terang (bukan flat color) */
var skyUni={topColor:{value:new THREE.Color(0x2373F4)},botColor:{value:new THREE.Color(0xcfe0f2)},off:{value:200},exp:{value:.9}};
var skyDome=new THREE.Mesh(new THREE.SphereGeometry(4600,24,14),new THREE.ShaderMaterial({
  uniforms:skyUni,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vP; void main(){vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 topColor; uniform vec3 botColor; uniform float off; uniform float exp; varying vec3 vP; void main(){float h=normalize(vP+vec3(0.,off,0.)).y; float t=pow(max(h,0.),exp); vec3 c=mix(botColor,topColor,t); gl_FragColor=vec4(c,1.);}'
}));
skyDome.frustumCulled=false;scene.add(skyDome);

var hemi=new THREE.HemisphereLight(0xbcd6ff,0x1a2340,.9);scene.add(hemi);
var sun=new THREE.DirectionalLight(0xffffff,.9);sun.position.set(-600,900,-400);scene.add(sun);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-1300;sun.shadow.camera.right=1300;
sun.shadow.camera.top=1300;sun.shadow.camera.bottom=-1300;
sun.shadow.camera.near=100;sun.shadow.camera.far=4200;
sun.shadow.bias=-0.0006;
scene.add(sun.target);
var amb=new THREE.AmbientLight(0x223355,.5);scene.add(amb);
var moonLight=new THREE.DirectionalLight(0xbcd0ff,0);moonLight.position.set(500,1200,800);scene.add(moonLight);
var iceLight=new THREE.PointLight(0x66c8ff,0,500);iceLight.position.set(-600,260,-256);scene.add(iceLight);
var summitLight=new THREE.PointLight(0xF2F7A0,0,600);summitLight.position.set(0,960,0);scene.add(summitLight);

/* ---------- TERRAIN MESH (high-res, smooth, AO) ---------- */
var W2=2600,D2=2200,SX=300,SZ=260;
var tg=new THREE.PlaneGeometry(W2,D2,SX,SZ);tg.rotateX(-PI/2);
var pos=tg.attributes.position, colors=new Float32Array(pos.count*3);
var cSnow=new THREE.Color(0xeaf3ff),cSnowB=new THREE.Color(0x65D0F4),cIce=new THREE.Color(0x2373F4),
    cRock=new THREE.Color(0x2a3350),cSun=new THREE.Color(0xF2F7A0),cMid=new THREE.Color(0x578EF5);
var tmpC=new THREE.Color();
for(var vi=0;vi<pos.count;vi++){
  var x=pos.getX(vi)+(-300),z=pos.getZ(vi)+(-80);
  pos.setX(vi,x);pos.setZ(vi,z);
  var h=heightAt(x,z);
  pos.setY(vi,h);
}
tg.computeVertexNormals();
var nrm=tg.attributes.normal;
for(var vj=0;vj<pos.count;vj++){
  var y=pos.getY(vj),ny=nrm.getY(vj);
  var slope=1-ny;
  tmpC.copy(cSnow);
  if(slope>.22)tmpC.lerp(cRock,smooth(.22,.5,slope));
  if(y>700)tmpC.lerp(cRock,smooth(700,900,y)*.7);
  if(slope>.1&&slope<.38&&y>500&&y<800)tmpC.lerp(cIce,.45);       /* blue ice face */
  tmpC.lerp(cSnowB,smooth(300,700,y)*.25);                          /* biru muda */
  tmpC.lerp(cMid,smooth(100,400,y)*.15);
  if(y>860)tmpC.lerp(cSun,smooth(860,936,y)*.55);                   /* sunrise tint summit */
  /* AO palsu lembah: rongga + kemiringan + sastrugi mikro */
  var cav=fbm(pos.getX(vj)*.006,pos.getZ(vj)*.006,4)*.5+.5; /* 0..1 */
  var ao=.62+.38*cav;
  ao*=1-slope*.28;
  ao*=1-smooth(500,150,y)*.18; /* dasar lembah lebih gelap */
  tmpC.multiplyScalar(ao);
  /* strata batuan: garis sedimen halus di tebing */
  if(slope>.22)tmpC.multiplyScalar(1+.05*Math.sin(y*.09+fbm(pos.getX(vj)*.01,pos.getZ(vj)*.01,2)*4));
  tmpC.offsetHSL(0,0,fbm(pos.getX(vj)*.05,pos.getZ(vj)*.05,2)*.02);
  colors[vj*3]=tmpC.r;colors[vj*3+1]=tmpC.g;colors[vj*3+2]=tmpC.b;
}
tg.setAttribute('color',new THREE.BufferAttribute(colors,3));
/* PBR: salju agak mengkilap + tekstur detail butiran */
var detailTex=(function(){
  var c=document.createElement('canvas');c.width=c.height=256;
  var g=c.getContext('2d');
  g.fillStyle='#ffffff';g.fillRect(0,0,256,256);
  for(var i=0;i<9000;i++){
    var v=200+((Math.random()*55)|0);
    g.fillStyle='rgb('+v+','+v+','+v+')';
    var s=Math.random()<.85?1:2;
    g.fillRect((Math.random()*256)|0,(Math.random()*256)|0,s,s);
  }
  g.strokeStyle='rgba(210,220,235,.5)';
  for(var k=0;k<60;k++){
    g.lineWidth=1;g.beginPath();
    var yy=(Math.random()*256)|0;
    g.moveTo(0,yy);g.bezierCurveTo(80,yy+6,170,yy-6,256,yy);
    g.stroke();
  }
  var t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(90,90);
  return t;
})();
var terrain=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({vertexColors:true,map:detailTex,flatShading:false,roughness:.58,metalness:.12}));
terrain.receiveShadow=true;terrain.castShadow=true;
scene.add(terrain);

/* cloud sea — lautan awan utk summit */
var cloudSeaMat=new THREE.MeshBasicMaterial({color:0xf4ecd0,transparent:true,opacity:0,fog:true});
var cloudSea=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),cloudSeaMat);
cloudSea.rotation.x=-PI/2;cloudSea.position.set(0,560,0);scene.add(cloudSea);

/* ---------- SNOW (Points) ---------- */
function dotTexture(){
  var c=document.createElement('canvas');c.width=c.height=64;
  var g=c.getContext('2d');var gr=g.createRadialGradient(32,32,2,32,32,30);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(0,0,64,64);
  var t=new THREE.CanvasTexture(c);return t;
}
var softTex=dotTexture();
var SNOW_N=2600, snowPos=new Float32Array(SNOW_N*3), snowVel=new Float32Array(SNOW_N);
for(var si=0;si<SNOW_N;si++){snowPos[si*3]=(Math.random()-.5)*900;snowPos[si*3+1]=Math.random()*700;snowPos[si*3+2]=(Math.random()-.5)*900;snowVel[si]=8+Math.random()*22;}
var snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowPos,3));
var snowMat=new THREE.PointsMaterial({size:2.6,map:softTex,transparent:true,opacity:.7,depthWrite:false,color:0xffffff});
var snow=new THREE.Points(snowGeo,snowMat);snow.frustumCulled=false;scene.add(snow);

/* awan melayang */
var CL_N=160,clPos=new Float32Array(CL_N*3);
for(var ci=0;ci<CL_N;ci++){clPos[ci*3]=(Math.random()-.5)*2400;clPos[ci*3+1]=300+Math.random()*500;clPos[ci*3+2]=(Math.random()-.5)*2400;}
var clGeo=new THREE.BufferGeometry();clGeo.setAttribute('position',new THREE.BufferAttribute(clPos,3));
var clMat=new THREE.PointsMaterial({size:90,map:softTex,transparent:true,opacity:.16,depthWrite:false,color:0xdceaff});
var clouds=new THREE.Points(clGeo,clMat);clouds.frustumCulled=false;scene.add(clouds);

/* badai: streak horizontal tertiup angin (dari icefall ke summit) */
var STORM_N=1400,stormPos=new Float32Array(STORM_N*3),stormSpd=new Float32Array(STORM_N);
for(var sti=0;sti<STORM_N;sti++){stormPos[sti*3]=(Math.random()-.5)*1000;stormPos[sti*3+1]=Math.random()*700;stormPos[sti*3+2]=(Math.random()-.5)*1000;stormSpd[sti]=120+Math.random()*260;}
var stormGeo=new THREE.BufferGeometry();stormGeo.setAttribute('position',new THREE.BufferAttribute(stormPos,3));
var stormMat=new THREE.PointsMaterial({size:3.2,map:softTex,transparent:true,opacity:0,depthWrite:false,color:0xe8f2ff});
var storm=new THREE.Points(stormGeo,stormMat);storm.frustumCulled=false;scene.add(storm);

/* kabut tanah: gumpalan besar menyapu BC -> Icefall */
var FOG_N=110,fogPos=new Float32Array(FOG_N*3),fogSeed=new Float32Array(FOG_N);
for(var fi=0;fi<FOG_N;fi++){
  var ft=RND?RND():Math.random();
  fogPos[fi*3]=-1050+ft*700;fogPos[fi*3+1]=120+Math.random()*180;fogPos[fi*3+2]=-420+Math.random()*340;
  fogSeed[fi]=Math.random()*10;
}
var fogGeo=new THREE.BufferGeometry();fogGeo.setAttribute('position',new THREE.BufferAttribute(fogPos,3));
var fogMat=new THREE.PointsMaterial({size:260,map:softTex,transparent:true,opacity:0,depthWrite:false,color:0xcfe0f2});
var fogBank=new THREE.Points(fogGeo,fogMat);fogBank.frustumCulled=false;scene.add(fogBank);

/* bintang */
var ST_N=900,stPos=new Float32Array(ST_N*3);
for(var ti=0;ti<ST_N;ti++){var th=Math.random()*PI*2,ph=Math.random()*PI*.45;var R=3800;stPos[ti*3]=Math.cos(th)*Math.cos(ph)*R;stPos[ti*3+1]=Math.sin(ph)*R+400;stPos[ti*3+2]=Math.sin(th)*Math.cos(ph)*R;}
var stGeo=new THREE.BufferGeometry();stGeo.setAttribute('position',new THREE.BufferAttribute(stPos,3));
var stMat=new THREE.PointsMaterial({size:7,map:softTex,transparent:true,opacity:0,depthWrite:false,color:0xffffff,sizeAttenuation:false});
var stars=new THREE.Points(stGeo,stMat);stars.frustumCulled=false;scene.add(stars);

/* kilau salju: glint yang berkelip di koridor rute */
var SPK_N=420,spkPos=new Float32Array(SPK_N*3);
for(var spi=0;spi<SPK_N;spi++){
  var spu=.02+Math.random()*.96;
  var scp=curve.getPointAt(spu);
  var ssx=scp.x+(Math.random()-.5)*90,ssz=scp.z+(Math.random()-.5)*90;
  spkPos[spi*3]=ssx;spkPos[spi*3+1]=heightAt(ssx,ssz)+.4;spkPos[spi*3+2]=ssz;
}
var spkGeo=new THREE.BufferGeometry();spkGeo.setAttribute('position',new THREE.BufferAttribute(spkPos,3));
var spkMat=new THREE.PointsMaterial({size:1.8,map:softTex,transparent:true,opacity:.4,depthWrite:false,color:0xffffff,blending:THREE.AdditiveBlending});
var sparkles=new THREE.Points(spkGeo,spkMat);sparkles.frustumCulled=false;scene.add(sparkles);

/* matahari REALISTIS: inti + korona + flare, bulan kawah */
function sunTexture(){
  var c=document.createElement('canvas');c.width=c.height=256;
  var g=c.getContext('2d');
  var gr=g.createRadialGradient(128,128,4,128,128,128);
  gr.addColorStop(0,'rgba(255,252,235,1)');
  gr.addColorStop(.18,'rgba(242,247,160,1)');
  gr.addColorStop(.32,'rgba(255,236,170,.85)');
  gr.addColorStop(.55,'rgba(255,220,150,.28)');
  gr.addColorStop(1,'rgba(255,210,130,0)');
  g.fillStyle=gr;g.fillRect(0,0,256,256);
  /* lidah korona */
  g.globalCompositeOperation='lighter';
  for(var i=0;i<40;i++){
    var a=Math.random()*Math.PI*2,r=60+Math.random()*50;
    g.strokeStyle='rgba(255,240,180,'+(0.05+Math.random()*.12)+')';
    g.lineWidth=1+Math.random()*2;
    g.beginPath();g.moveTo(128+Math.cos(a)*52,128+Math.sin(a)*52);
    g.lineTo(128+Math.cos(a)*r,128+Math.sin(a)*r);g.stroke();
  }
  return new THREE.CanvasTexture(c);
}
function moonTexture(){
  var c=document.createElement('canvas');c.width=c.height=256;
  var g=c.getContext('2d');
  var gr=g.createRadialGradient(128,128,20,128,128,128);
  gr.addColorStop(0,'#f4f8ff');gr.addColorStop(.8,'#dbe6f7');gr.addColorStop(1,'#b9c9e4');
  g.fillStyle=gr;g.beginPath();g.arc(128,128,126,0,7);g.fill();
  /* kawah */
  var rr=seeded(77);
  for(var i=0;i<28;i++){
    var x=40+rr()*176,y=40+rr()*176,r=4+rr()*18;
    g.fillStyle='rgba(160,175,200,'+(0.25+rr()*.3)+')';
    g.beginPath();g.arc(x,y,r,0,7);g.fill();
    g.fillStyle='rgba(255,255,255,.5)';
    g.beginPath();g.arc(x-r*.25,y-r*.25,r*.5,0,7);g.fill();
  }
  /* terminator: gelap kanan bawah */
  var sh=g.createLinearGradient(60,60,220,220);
  sh.addColorStop(.55,'rgba(20,30,60,0)');sh.addColorStop(1,'rgba(20,30,60,.45)');
  g.fillStyle=sh;g.beginPath();g.arc(128,128,126,0,7);g.fill();
  return new THREE.CanvasTexture(c);
}
var sunTexC=sunTexture(),moonTexC=moonTexture();
var sunMesh=new THREE.Mesh(new THREE.CircleGeometry(95,48),new THREE.MeshBasicMaterial({map:sunTexC,transparent:true,opacity:0,fog:false,depthWrite:false}));
sunMesh.position.set(300,1050,600);sunMesh.lookAt(0,900,0);scene.add(sunMesh);
var sunHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:sunTexC,color:0xfff2c0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
sunHalo.scale.set(700,700,1);sunHalo.position.copy(sunMesh.position);scene.add(sunHalo);
var sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color:0xfff6c8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
sunGlow.scale.set(1600,1600,1);sunGlow.position.copy(sunMesh.position);scene.add(sunGlow);
/* lens flare ghosts */
var flare1=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color:0xF2F7A0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
flare1.scale.set(120,120,1);scene.add(flare1);
var flare2=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color:0x65D0F4,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
flare2.scale.set(70,70,1);scene.add(flare2);
var moonMesh=new THREE.Mesh(new THREE.CircleGeometry(70,48),new THREE.MeshBasicMaterial({map:moonTexC,transparent:true,opacity:0,fog:false}));
moonMesh.position.set(-500,1350,900);moonMesh.lookAt(0,900,0);scene.add(moonMesh);
var moonHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color:0xbcd4ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
moonHalo.scale.set(600,600,1);moonHalo.position.copy(moonMesh.position);scene.add(moonHalo);

/* ---------- PROPS REALISTIS : BASECAMP ---------- */
function seeded(s){s=s>>>0||1;return function(){s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
var RND=seeded(1234567);
/* --- tenda realistis: prisma + pintu menyala + pool cahaya + guy-line + gundukan salju --- */
function makeTent(x,z,colorHex,scale,glow){
  scale=scale||1;
  var y=heightAt(x,z);
  var g=new THREE.Group();g.position.set(x,y,z);
  var mat=new THREE.MeshStandardMaterial({color:colorHex,roughness:.85,metalness:0,flatShading:true});
  /* badan tenda: piramida gepeng 4 sisi */
  var body=new THREE.Mesh(new THREE.ConeGeometry(8*scale,7*scale,4,1),mat);
  body.position.y=3.2*scale;body.rotation.y=PI/4+RND()*.4;g.add(body);
  /* alas gelap */
  var base=new THREE.Mesh(new THREE.CylinderGeometry(8.6*scale,9*scale,1.2*scale,4,1),new THREE.MeshStandardMaterial({color:0x1a2233,roughness:1,flatShading:true}));
  base.position.y=.4*scale;base.rotation.y=PI/4;g.add(base);
  /* pintu segitiga menyala hangat */
  var door=new THREE.Mesh(new THREE.PlaneGeometry(3.4*scale,4.4*scale),new THREE.MeshBasicMaterial({color:0xffc37a}));
  door.position.set(0,2.4*scale,5.65*scale);door.rotation.x=-.22;g.add(door);
  var doorFrame=new THREE.Mesh(new THREE.PlaneGeometry(4.2*scale,5.2*scale),new THREE.MeshStandardMaterial({color:0x2a1f14,roughness:1}));
  doorFrame.position.set(0,2.3*scale,5.55*scale);doorFrame.rotation.x=-.22;g.add(doorFrame);
  door.position.z+=.12; /* di depan frame */
  /* gundukan salju di kaki tenda */
  var mound=new THREE.Mesh(new THREE.SphereGeometry(9.5*scale,10,7),new THREE.MeshStandardMaterial({color:0xdfe9f5,roughness:1,flatShading:true}));
  mound.scale.set(1,.28,1);mound.position.y=.2;g.add(mound);
  /* pool cahaya hangat di tanah */
  if(glow){
    var pool=new THREE.Mesh(new THREE.CircleGeometry(20*scale,24),new THREE.MeshBasicMaterial({color:0xff9a3c,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false}));
    pool.rotation.x=-PI/2;pool.position.y=.6;g.add(pool);
    var pool2=new THREE.Mesh(new THREE.CircleGeometry(10*scale,20),new THREE.MeshBasicMaterial({color:0xffd9a0,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));
    pool2.rotation.x=-PI/2;pool2.position.y=.7;g.add(pool2);
  }
  /* guy-lines: 4 tali ke pasak */
  var lg=new THREE.BufferGeometry(),lp=[];
  for(var k=0;k<4;k++){
    var a=k*PI/2+PI/4;
    lp.push(0,5.5*scale,0, Math.cos(a)*11*scale,.3,Math.sin(a)*11*scale);
    var peg=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,2.4),new THREE.MeshStandardMaterial({color:0x8a6b4a}));
    peg.position.set(Math.cos(a)*11*scale,1,.3+Math.sin(a)*11*scale);peg.rotation.z=Math.cos(a)*.5;peg.rotation.x=-Math.sin(a)*.5;g.add(peg);
  }
  lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(lp),3));
  g.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0xcfd8e6,transparent:true,opacity:.7})));
  /* tali jemuran kecil / ransel */
  var box=new THREE.Mesh(new THREE.BoxGeometry(2.2*scale,1.6*scale,1.4*scale),new THREE.MeshStandardMaterial({color:0x37415c,roughness:1,flatShading:true}));
  box.position.set(9*scale,1.2*scale,3*scale);box.rotation.y=RND();g.add(box);
  scene.add(g);
  return g;
}
/* tenda utama oranye (seperti screenshot kanan) + 3 tenda pendukung */
makeTent(-872,-322,0xe8822e,1.5,true);
makeTent(-915,-292,0xc96a24,1.0,true);
makeTent(-948,-332,0x65D0F4,.9,false);
makeTent(-985,-305,0xd8a05a,.8,false);
/* 2 point light hangat saja (hemat perf) */
var tentLight1=new THREE.PointLight(0xffa54d,1.6,120);tentLight1.position.set(-872,heightAt(-872,-322)+8,-318);scene.add(tentLight1);
var tentLight2=new THREE.PointLight(0xffc37a,.9,90);tentLight2.position.set(-915,heightAt(-915,-292)+6,-292);scene.add(tentLight2);

/* --- prayer flags realistis: 2 tiang + tali catenary + 30 bendera kain --- */
var flagMeshes=[],flagPhase=[];
(function prayerFlags(){
  var cols=[0xd94f3d,0x2e7de9,0xf2f7a0,0x3fae6a,0x3fa9d9,0xffffff];
  function pole(x,z,h){
    var y=heightAt(x,z);
    var p=new THREE.Mesh(new THREE.CylinderGeometry(.35,.45,h,6),new THREE.MeshStandardMaterial({color:0x4a3826,roughness:1}));
    p.position.set(x,y+h/2,z);scene.add(p);
    return new THREE.Vector3(x,y+h,z);
  }
  var A=pole(-952,-300,15),B=pole(-898,-306,13),C=pole(-838,-318,15);
  function catenary(a,b,sag,n){
    var pts=[];for(var i=0;i<=n;i++){var t=i/n;var p=a.clone().lerp(b,t);p.y-=Math.sin(t*PI)*sag;pts.push(p);}return pts;
  }
  var lines=[catenary(A,B,3.2,24),catenary(B,C,4.2,30)];
  lines.forEach(function(pts,li){
    /* tali */
    var ropeG=new THREE.BufferGeometry().setFromPoints(pts);
    scene.add(new THREE.Line(ropeG,new THREE.LineBasicMaterial({color:0x8a7a5a})));
    /* bendera gantung */
    for(var i=2;i<pts.length-1;i+=2){
      var col=cols[(i+li*3)%cols.length];
      var fw=2.1+RND()*.5,fh=1.5+RND()*.4;
      var fg=new THREE.PlaneGeometry(fw,fh,3,1);
      var fm=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:col,side:THREE.DoubleSide,roughness:.9}));
      var rp=pts[i];
      fm.position.set(rp.x,rp.y-fh/2+.1,rp.z);
      /* lipatan kain: tekuk vertex tengah */
      fm.userData.base=rp.clone();fm.userData.i=flagMeshes.length;
      scene.add(fm);flagMeshes.push(fm);flagPhase.push(RND()*10);
    }
  });
})();
/* bebatuan moraine + scree REALISTIS (3 varian warna, sebaran alami) */
(function rocks(){
  var geos=[new THREE.DodecahedronGeometry(1,0),new THREE.DodecahedronGeometry(1,0),new THREE.DodecahedronGeometry(1,0)];
  var mats=[
    new THREE.MeshStandardMaterial({color:0x4a4a52,roughness:.95,flatShading:true}),
    new THREE.MeshStandardMaterial({color:0x6b6f78,roughness:.9,flatShading:true}),
    new THREE.MeshStandardMaterial({color:0x3a3f4d,roughness:1,flatShading:true})
  ];
  var COUNT=380;
  var meshes=mats.map(function(m,i){var im=new THREE.InstancedMesh(geos[i],m,Math.ceil(COUNT/3)+10);im.instanceMatrix.setUsage(THREE.StaticDrawUsage);scene.add(im);return im;});
  var dummy=new THREE.Object3D(),idx=[0,0,0];
  function put(x,z,s){
    var y=heightAt(x,z);
    var mi=(RND()*3)|0;
    dummy.position.set(x,y+s*.15,z);
    dummy.rotation.set(RND()*PI,RND()*PI,RND()*PI);
    dummy.scale.set(s*(0.7+RND()*.7),s*(0.5+RND()*.6),s*(0.7+RND()*.7));
    dummy.updateMatrix();
    meshes[mi].setMatrixAt(idx[mi]++,dummy.matrix);
  }
  /* 1) moraine di sekitar basecamp, hindari jalur tengah */
  for(var i=0;i<200;i++){
    var x=-1020+RND()*260,z=-380+RND()*160;
    if(Math.abs(z+312)<22&&RND()<.85)continue; /* jalur pendakian bersih */
    put(x,z,1+RND()*RND()*7);
  }
  /* 2) scree slope menanjak seperti screenshot: punggungan batu ke arah gunung */
  for(var j=0;j<150;j++){
    var t=RND();
    var cx=lerp(-880,-560,t)+(RND()-.5)*(60+t*160);
    var cz=-290+(RND()-.5)*(50+t*150)-t*10;
    if(Math.abs(cz+265)<10&&RND()<.7)continue;
    put(cx,cz,.8+RND()*RND()*6*(1-t*.4));
  }
  /* 3) kerikil halus dekat kamera */
  for(var k=0;k<30;k++){put(-960+RND()*160,-340+RND()*80,.4+RND()*.9);}
  meshes.forEach(function(m,i2){m.count=idx[i2];m.instanceMatrix.needsUpdate=true;});
})();
/* bongkahan es REALISTIS: batu es tak-beraturan + tudung salju (bukan abstrak) */
(function icefall(){
  var iceMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.06,flatShading:true,emissive:0x0d2c52,emissiveIntensity:.28});
  var deepMat=new THREE.MeshBasicMaterial({color:0x2373F4,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false});
  var cTop=new THREE.Color(0xf4f8fd),cMid=new THREE.Color(0xbfe0f8),cDeep=new THREE.Color(0x2e6fd8),cSnow=new THREE.Color(0xffffff);
  var tc=new THREE.Color();
  /* satu bongkahan: icosahedron digerogoti noise — tiap sisi tak sama */
  function iceRock(r,tower,seed){
    var geo=new THREE.IcosahedronGeometry(r,1);
    var pa=geo.attributes.position;
    var yS=tower?1.6+RND()*.9:1;
    for(var i=0;i<pa.count;i++){
      var vx=pa.getX(i),vy=pa.getY(i),vz=pa.getZ(i);
      var n=fbm(vx*.4+seed*7.3,(vy+vz)*.35-seed*3.1,3);
      var s=1+n*.38;
      pa.setXYZ(i,vx*s,vy*s*yS,vz*s);
    }
    geo.computeVertexNormals();
    var nm=geo.attributes.normal;
    var minY=1e9,maxY=-1e9;
    for(var k=0;k<pa.count;k++){var yy=pa.getY(k);if(yy<minY)minY=yy;if(yy>maxY)maxY=yy;}
    var cols=new Float32Array(pa.count*3);
    for(var j=0;j<pa.count;j++){
      var ny=nm.getY(j);
      var h=(pa.getY(j)-minY)/Math.max(1e-3,(maxY-minY));
      tc.copy(cDeep).lerp(cMid,smooth(0,.55,h));
      tc.lerp(cTop,smooth(.45,.8,h)*.7);
      if(ny>.55)tc.lerp(cSnow,smooth(.55,.9,ny)); /* salju menempel di sisi atas */
      tc.multiplyScalar(.92+RND()*.14);
      cols[j*3]=tc.r;cols[j*3+1]=tc.g;cols[j*3+2]=tc.b;
    }
    geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
    return new THREE.Mesh(geo,iceMat);
  }
  /* dinding labirin: tumpukan menara di kiri-kanan jalur */
  for(var k=0;k<64;k++){
    var u=.1+RND()*.32;
    var c=curve.getPointAt(u),cn=curve.getPointAt(Math.min(1,u+.01));
    var d=new THREE.Vector3().subVectors(cn,c);d.y=0;
    if(d.lengthSq()<1e-6)d.set(0,0,1);d.normalize();
    var sd=new THREE.Vector3(-d.z,0,d.x);
    var sgn=RND()<.5?-1:1;
    var dist=15+RND()*RND()*60;
    var gx=c.x+sd.x*sgn*dist+(RND()-.5)*10;
    var gz=c.z+sd.z*sgn*dist+(RND()-.5)*10;
    var tower=RND()<.55;
    var r=3.5+RND()*RND()*8+(tower?3:0);
    var m=iceRock(r,tower,RND()*10);
    m.position.set(gx,heightAt(gx,gz)+r*.35,gz);
    var kind=RND();
    if(kind<.2)m.rotation.set(1.1+RND()*.4,RND()*PI,(RND()-.5)*.4);      /* roboh menggelinding */
    else if(kind<.45)m.rotation.set((RND()-.5)*1.1,RND()*PI,.5+RND()*.5); /* slab bersandar */
    else m.rotation.set((RND()-.5)*.5,RND()*PI,(RND()-.5)*.5);            /* menara tegak */
    scene.add(m);
  }
  /* runtuhan es kecil di kaki serac */
  for(var q=0;q<44;q++){
    var u2=.1+RND()*.32;
    var c2=curve.getPointAt(u2);
    var gx2=c2.x+(RND()-.5)*130,gz2=c2.z+(RND()-.5)*120;
    var r2=1+RND()*2.4;
    var s2=iceRock(r2,false,RND()*10);
    s2.position.set(gx2,heightAt(gx2,gz2)+r2*.3,gz2);
    s2.rotation.set(RND()*3,RND()*3,RND()*3);
    scene.add(s2);
  }
  /* glow biru di dalam crevasse */
  for(var ci=0;ci<8;ci++){
    var cx2=-690+RND()*220,cz2=-300+RND()*80;
    var glow=new THREE.Mesh(new THREE.PlaneGeometry(26+RND()*30,5),deepMat);
    glow.position.set(cx2,heightAt(cx2,cz2)+1.5,cz2);
    glow.rotation.x=-PI/2;glow.rotation.z=RND()*PI;scene.add(glow);
  }
})();
/* fixed rope face */
var ropePts=[];for(var r2=.5;r2<=.72;r2+=.01){ropePts.push(curve.getPointAt(r2).clone().add(new THREE.Vector3(4,2,0)));}
var rope=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ropePts),60,0.5,5),new THREE.MeshBasicMaterial({color:0xF2F7A0}));
scene.add(rope);
/* summit: tiang + tali + bendera KAIN cloth-sim */
var poleY=heightAt(0,0);
var pole=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,17,8),new THREE.MeshStandardMaterial({color:0x3a3f4d,roughness:.7,metalness:.4}));
pole.position.set(0,poleY+8.5,0);scene.add(pole);
var poleCap=new THREE.Mesh(new THREE.SphereGeometry(.8,8,8),new THREE.MeshStandardMaterial({color:0xF2F7A0,roughness:.4}));
poleCap.position.set(0,poleY+17.2,0);scene.add(poleCap);
/* kain bendera: tekstur anyaman + jahitan */
function flagTexture(){
  /* merah-putih Indonesia */
  var c=document.createElement('canvas');c.width=128;c.height=84;
  var g=c.getContext('2d');
  g.fillStyle='#e70011';g.fillRect(0,0,128,42);
  g.fillStyle='#f8f8f8';g.fillRect(0,42,128,42);
  /* anyaman kain + bayangan lipatan */
  g.fillStyle='rgba(0,0,0,.08)';
  for(var y=0;y<84;y+=4)g.fillRect(0,y,128,1);
  for(var x=0;x<128;x+=4)g.fillRect(x,0,1,84);
  var sh=g.createLinearGradient(0,0,128,0);
  sh.addColorStop(0,'rgba(0,0,0,.28)');sh.addColorStop(.25,'rgba(0,0,0,0)');
  sh.addColorStop(.8,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.22)');
  g.fillStyle=sh;g.fillRect(0,0,128,84);
  g.fillStyle='rgba(255,255,255,.3)';g.fillRect(0,0,128,6);
  return new THREE.CanvasTexture(c);
}
var sflagGeo=new THREE.PlaneGeometry(11,6.5,14,7);
sflagGeo.translate(5.5,0,0); /* jepit di tiang x=0 */
var sflagBase=sflagGeo.attributes.position.array.slice();
var sflag=new THREE.Mesh(sflagGeo,new THREE.MeshStandardMaterial({map:flagTexture(),side:THREE.DoubleSide,roughness:.85,metalness:0}));
sflag.position.set(.4,poleY+13.5,0);scene.add(sflag);
/* gundukan + jejak kaki di summit */
var sumMound=new THREE.Mesh(new THREE.SphereGeometry(7,12,8),new THREE.MeshStandardMaterial({color:0xe8eef8,roughness:1,flatShading:false}));
sumMound.scale.set(1,.3,1);sumMound.position.set(0,poleY+.2,0);scene.add(sumMound);

/* ---------- TIM PENDAKI 3D: jalan saat kamu scroll ---------- */
var beamTex=(function(){
  var c=document.createElement('canvas');c.width=16;c.height=128;
  var g=c.getContext('2d');
  var gr=g.createLinearGradient(0,0,0,128);
  gr.addColorStop(0,'rgba(255,244,210,.9)');
  gr.addColorStop(.4,'rgba(255,240,200,.38)');
  gr.addColorStop(1,'rgba(255,240,200,0)');
  g.fillStyle=gr;g.fillRect(0,0,16,128);
  return new THREE.CanvasTexture(c);
})();
function makeClimber(jacket, pants){
  var g=new THREE.Group();
  var mJ=new THREE.MeshStandardMaterial({color:jacket,roughness:.8,flatShading:true});
  var mP=new THREE.MeshStandardMaterial({color:pants,roughness:.9,flatShading:true});
  var mS=new THREE.MeshStandardMaterial({color:0xe8b88a,roughness:.7});
  var mD=new THREE.MeshStandardMaterial({color:0x222831,roughness:.8});
  var torso=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.3,1.05),mJ);torso.position.y=3.6;g.add(torso);
  var pack=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.8,.7),mD);pack.position.set(0,3.7,-.85);g.add(pack);
  var roll=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,1.5,7),new THREE.MeshStandardMaterial({color:0x65D0F4,roughness:.8}));
  roll.rotation.z=PI/2;roll.position.set(0,4.75,-.85);g.add(roll);
  var head=new THREE.Mesh(new THREE.SphereGeometry(.62,10,9),mS);head.position.y=5.35;g.add(head);
  var hat=new THREE.Mesh(new THREE.SphereGeometry(.66,10,6,0,PI*2,0,PI*.55),new THREE.MeshStandardMaterial({color:0xF2F7A0,roughness:.9}));
  hat.position.y=5.45;g.add(hat);
  var gog=new THREE.Mesh(new THREE.BoxGeometry(1.0,.34,.3),new THREE.MeshStandardMaterial({color:0x111622,roughness:.3,metalness:.4}));
  gog.position.set(0,5.35,.5);g.add(gog);
  var lamp=new THREE.Mesh(new THREE.SphereGeometry(.16,6,6),new THREE.MeshBasicMaterial({color:0xfff6d8}));
  lamp.position.set(0,5.55,.6);g.add(lamp);
  var lampGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color:0xffedb0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  lampGlow.scale.set(7,7,1);lampGlow.position.copy(lamp.position);g.add(lampGlow);
  /* sorot senter: kerucut cahaya ke depan */
  var beamGeo=new THREE.ConeGeometry(3.4,26,12,1,true);
  beamGeo.translate(0,-13,0);beamGeo.rotateX(-PI/2);
  var beam=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({map:beamTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
  beam.position.copy(lamp.position);g.add(beam);
  var spot=new THREE.SpotLight(0xfff2c8,0,70,.38,.55,1);
  spot.position.copy(lamp.position);
  spot.target.position.set(0,3.2,22);
  g.add(spot);g.add(spot.target);
  function limb(w,h,mat,px,py){
    var pivot=new THREE.Group();pivot.position.set(px,py,0);
    var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),mat);m.position.y=-h/2;pivot.add(m);
    g.add(pivot);return pivot;
  }
  var armL=limb(.5,2.1,mJ,-1.15,4.6),armR=limb(.5,2.1,mJ,1.15,4.6);
  var stick=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,3.4,5),mD);
  stick.position.set(0,-2.2,.3);stick.rotation.x=.25;armR.add(stick);
  var legL=limb(.62,2.4,mP,-.45,2.45),legR=limb(.62,2.4,mP,.45,2.45);
  [legL,legR].forEach(function(leg){
    var boot=new THREE.Mesh(new THREE.BoxGeometry(.7,.5,1.1),mD);
    boot.position.set(0,-2.6,.2);leg.add(boot);
  });
  g.traverse(function(o){if(o.isMesh){o.castShadow=true;}});
  return {g:g,torso:torso,head:head,armL:armL,armR:armR,legL:legL,legR:legR,lampGlow:lampGlow,beam:beam,spot:spot,phase:Math.random()*6,lastStep:0,stepSide:1,heading:1};
}
var climbers=[
  Object.assign(makeClimber(0xe8822e,0x2a3350),{off:0.004,side:3.5}),
  Object.assign(makeClimber(0x2373F4,0x1c2233),{off:0.02,side:-3.5}),
  Object.assign(makeClimber(0x65D0F4,0x37415c),{off:-0.012,side:4.5})
];
climbers.forEach(function(c){scene.add(c.g);});
var ropeTeamGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]);
var ropeTeam=new THREE.Line(ropeTeamGeo,new THREE.LineBasicMaterial({color:0xF2F7A0}));
scene.add(ropeTeam);
var lastP_climb=0;
/* kolam jejak kaki: 260 cetakan elips, didaur ulang */
var FOOT_N=260,footIdx=0;
var footGeo=new THREE.CircleGeometry(.55,10);footGeo.rotateX(-PI/2);footGeo.scale(.85,1,1.5);
var footMesh=new THREE.InstancedMesh(footGeo,new THREE.MeshBasicMaterial({color:0x8fa8cf,transparent:true,opacity:.5,depthWrite:false}),FOOT_N);
footMesh.frustumCulled=false;
(function(){var d=new THREE.Object3D();d.position.set(0,-9999,0);d.scale.setScalar(.001);d.updateMatrix();for(var fi0=0;fi0<FOOT_N;fi0++)footMesh.setMatrixAt(fi0,d.matrix);})();
scene.add(footMesh);
var _fd=new THREE.Object3D();
function dropFoot(x,y,z,rotY){
  _fd.position.set(x,y,z);_fd.rotation.set(0,rotY,0);_fd.scale.set(1,1,1);_fd.updateMatrix();
  footMesh.setMatrixAt(footIdx%FOOT_N,_fd.matrix);footIdx++;
  footMesh.instanceMatrix.needsUpdate=true;
}
/* tanah summit = terrain + gundukan (biar kaki tidak masuk gunung) */
function summitGround(x,z){
  var g=heightAt(x,z);
  var d=Math.sqrt(x*x+z*z);
  if(d<7)g=Math.max(g,poleY+.2+.3*Math.sqrt(Math.max(0,49-d*d)));
  return g;
}
function updateClimbers(p,time,wind,speed){
  var dp=p-lastP_climb;lastP_climb=p;
  var hold=smooth(.93,.985,p); /* efek pegang bendera di summit */
  var standPos=new THREE.Vector3(4.2,summitGround(4.2,2.0)+.1,2.0);
  var flagTop=new THREE.Vector3(0,poleY+13.5,0);
  climbers.forEach(function(c,idx){
    var u=clamp(p*.985+.005+c.off,0.005,0.995);
    var pos=curve.getPointAt(u),ahead=curve.getPointAt(clamp(u+.012,0,1));
    var dir=new THREE.Vector3().subVectors(ahead,pos);dir.y*=0.3;
    if(dir.lengthSq()<1e-6)dir.set(0,0,1);
    var dirN=dir.clone().normalize();
    /* arah hadap: scroll naik = menghadap ke atas, scroll turun = ke bawah */
    if(dp>0.000004)c.heading=1;else if(dp<-0.000004)c.heading=-1;
    var side=new THREE.Vector3(-dirN.z,0,dirN.x);
    c.g.position.copy(pos).addScaledVector(side,c.side);
    /* tempel kaki ke tanah (termasuk gundukan summit) */
    var gy=heightAt(c.g.position.x,c.g.position.z);
    gy=lerp(gy,summitGround(c.g.position.x,c.g.position.z),smooth(.9,.97,p));
    c.g.position.y=gy;
    var isLeader=idx===0;
    var holdW=isLeader?hold:0;
    if(holdW>0)c.g.position.lerp(standPos,holdW);
    var look;
    if(holdW>.5)look=flagTop;
    else look=c.g.position.clone().addScaledVector(dirN,c.heading);
    c.g.lookAt(look.x,c.g.position.y,look.z);
    c.phase+=Math.abs(dp)*900*(1+idx*.12)+Math.abs(scrollVel)*2.2+speed*.12;
    var sw=Math.sin(c.phase),sw2=Math.sin(c.phase+PI);
    var stride=clamp(.25+Math.abs(dp)*400+speed*.9+wind*.008,.25,1)*(1-holdW*.75);
    c.legL.rotation.x=sw*.75*stride;
    c.legR.rotation.x=sw2*.75*stride;
    c.armL.rotation.x=sw2*.55*stride;
    var walkArmR=sw*.55*stride-.25;
    /* tangan kanan terangkat memegang tiang saat summit */
    c.armR.rotation.x=lerp(walkArmR,-2.55,holdW);
    c.armR.rotation.z=lerp(-.12,0,holdW);
    c.armL.rotation.z=.12;
    /* tangan kiri melambai saat summit */
    if(holdW>.5){c.armL.rotation.z=.9+Math.sin(time*6)*.5;c.armL.rotation.x=lerp(c.armL.rotation.x,-.4,holdW);}
    c.g.position.y+=Math.abs(Math.cos(c.phase))*.28*stride;
    /* selebrasi summit: loncat-loncat gembira */
    var celeb=smooth(.955,.995,p)*(isLeader?1:.7);
    if(celeb>0.01){
      var jj=time*5.2+idx*1.4;
      var air=Math.abs(Math.sin(jj));
      c.g.position.y+=air*2.6*celeb;
      var tuck=Math.sin(jj)>0?.65:.15;
      c.legL.rotation.x=lerp(c.legL.rotation.x,tuck,celeb);
      c.legR.rotation.x=lerp(c.legR.rotation.x,tuck*.7,celeb);
      c.legL.rotation.z=lerp(c.legL.rotation.z||0,.3,celeb);
      c.legR.rotation.z=lerp(c.legR.rotation.z||0,-.3,celeb);
      if(!isLeader){
        c.armL.rotation.x=lerp(c.armL.rotation.x,-2.9,celeb);
        c.armR.rotation.x=lerp(c.armR.rotation.x,-2.9,celeb);
        c.armL.rotation.z=lerp(c.armL.rotation.z,.4,celeb);
        c.armR.rotation.z=lerp(c.armR.rotation.z,-.4,celeb);
      }
    }
    /* badan condong ke arah gerak: naik = bongkok, turun = senderan */
    c.torso.rotation.x=lerp(c.heading>0?.14+stride*.1:-.12,0,holdW);
    c.head.rotation.x=holdW>.5?-.5:-.1;
    var night=(dayNight==='night')?1:smooth(.55,.75,p);
    c.lampGlow.material.opacity=Math.min(1,night*1.2);
    c.beam.material.opacity=night*(.45+Math.sin(time*13+idx*2)*.05);
    c.spot.intensity=night*2.4;
    /* jejak kaki: tiap setengah langkah, kiri/kanan bergantian */
    if(c.phase-c.lastStep>PI){
      c.lastStep=c.phase;
      c.stepSide=-(c.stepSide||1);
      var lat=side.clone().multiplyScalar(c.stepSide*.5);
      var fwd=dirN.clone().multiplyScalar(.6*c.heading);
      dropFoot(c.g.position.x+lat.x+fwd.x,gy+.07,c.g.position.z+lat.z+fwd.z,Math.atan2(dirN.x*c.heading,dirN.z*c.heading));
    }
  });
  var pts=ropeTeamGeo.attributes.position;
  climbers.forEach(function(c,i){
    var v=c.g.position.clone();v.y+=3.4;
    if(i===1)v.y-=.8;
    pts.setXYZ(i,v.x,v.y,v.z);
  });
  pts.needsUpdate=true;
}
/* ---------- ROCKFALL FACE<->8K: batu jatuh + debu berkabut ---------- */
var rockRumble=0,rockAct=0;
var FALL_N=12,falls=[];
var fallGeo=new THREE.DodecahedronGeometry(1,0);
var fallMats=[0x4a4a52,0x6b6f78,0x3a3f4d].map(function(c){return new THREE.MeshStandardMaterial({color:c,roughness:.95,flatShading:true});});
for(var fri=0;fri<FALL_N;fri++){
  var fm=new THREE.Mesh(fallGeo,fallMats[fri%3]);
  var fs=.8+RND()*1.6;
  fm.scale.set(fs*(.8+RND()*.5),fs*(.7+RND()*.5),fs*(.8+RND()*.5));
  fm.rotation.set(RND()*3,RND()*3,RND()*3);
  fm.visible=false;scene.add(fm);
  falls.push({m:fm,vel:new THREE.Vector3(),ang:new THREE.Vector3(),active:false,bounces:0,wait:RND()*5});
}
/* corong runtuhan: bongkahan di punggungan — menggelinding dari batuan, bukan langit */
var chutes=[];
function downhill(x,z){
  var e=4;
  var gx=(heightAt(x+e,z)-heightAt(x-e,z))/(2*e);
  var gz=(heightAt(x,z+e)-heightAt(x,z-e))/(2*e);
  var d=new THREE.Vector3(-gx,0,-gz);
  if(d.lengthSq()<1e-6)d.set(1,0,0);
  return d.normalize();
}
[.58,.64,.70,.76,.82,.88,.93].forEach(function(u){
  var cc=curve.getPointAt(u);
  var cn=curve.getPointAt(Math.min(1,u+.01));
  var dd=new THREE.Vector3().subVectors(cn,cc);dd.y=0;
  if(dd.lengthSq()<1e-6)dd.set(0,0,1);dd.normalize();
  var sd=new THREE.Vector3(-dd.z,0,dd.x);
  var sgn=RND()<.5?-1:1,dist=18+RND()*20;
  var sx=cc.x+sd.x*sgn*dist,sz=cc.z+sd.z*sgn*dist;
  chutes.push({pos:new THREE.Vector3(sx,summitGround(sx,sz)+2,sz),dir:downhill(sx,sz)});
});
/* tumpukan batuan summit: sumber gelindingan yang terlihat */
(function summitRocks(){
  for(var i=0;i<26;i++){
    var u=.86+RND()*.13;
    var c=curve.getPointAt(u);
    var a=RND()*PI*2,dist2=9+RND()*22;
    var rx=c.x+Math.cos(a)*dist2,rz=c.z+Math.sin(a)*dist2*.7;
    if(Math.sqrt(rx*rx+rz*rz)<7.5)continue; /* jangan timbun tiang */
    var rk=new THREE.Mesh(fallGeo,fallMats[i%3]);
    var rs=1+RND()*2.6;
    rk.scale.set(rs*(.8+RND()*.5),rs*(.6+RND()*.5),rs*(.8+RND()*.5));
    rk.position.set(rx,summitGround(rx,rz)+rs*.3,rz);
    rk.rotation.set(RND()*3,RND()*3,RND()*3);
    scene.add(rk);
  }
})();
/* debu kabut */
var PUFF_N=70,puffs=[],puffIdx=0;
for(var pfi=0;pfi<PUFF_N;pfi++){
  var ps=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color:0xcfd8ea,transparent:true,opacity:0,depthWrite:false}));
  ps.scale.set(6,6,1);scene.add(ps);
  puffs.push({s:ps,life:1e9,max:1.6,big:1});
}
function puff(x,y,z,big,col){
  var pf=puffs[puffIdx++%PUFF_N];
  pf.s.position.set(x+(RND()-.5)*4,y+(RND()-.5)*3,z+(RND()-.5)*4);
  pf.s.material.color.setHex(col||0xcfd8ea);
  pf.life=0;pf.max=1.2+RND()*.9;pf.big=big||1;
}
function spawnFall(f){
  var ch=chutes[(RND()*chutes.length)|0];
  f.m.position.set(ch.pos.x+(RND()-.5)*6,ch.pos.y+RND()*2,ch.pos.z+(RND()-.5)*6);
  f.vel.set(ch.dir.x*(6+RND()*10)+((RND()-.5)*5),-2-RND()*4,ch.dir.z*(6+RND()*10)+((RND()-.5)*5));
  f.ang.set((RND()-.5)*8,(RND()-.5)*8,(RND()-.5)*8);
  f.active=true;f.bounces=0;
}
function updateRockfall(p,dt,wind){
  var act=smooth(.45,.58,p)*(1-smooth(.965,.995,p));
  rockAct=act;
  var minD=1e9;
  falls.forEach(function(f){
    if(!f.active){
      f.m.visible=false;
      if(act>.15){f.wait-=dt*(.4+act*1.4);if(f.wait<=0)spawnFall(f);}
      return;
    }
    if(act<=.05){f.active=false;f.m.visible=false;f.wait=1+RND()*3;return;}
    f.m.visible=true;
    f.vel.y-=55*dt;
    f.m.position.addScaledVector(f.vel,dt);
    f.m.rotation.x+=f.ang.x*dt;f.m.rotation.y+=f.ang.y*dt;f.m.rotation.z+=f.ang.z*dt;
    var dx=f.m.position.x-camera.position.x,dy=f.m.position.y-camera.position.y,dz=f.m.position.z-camera.position.z;
    var dd=Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(dd<minD)minD=dd;
    var g=heightAt(f.m.position.x,f.m.position.z);
    if(f.m.position.y<g+.6){
      f.m.position.y=g+.6;
      puff(f.m.position.x,g+2,f.m.position.z,1.2); /* debu batu */
      puff(f.m.position.x,g+1.5,f.m.position.z,1.0,0xffffff); /* salju terpental */
      puff(f.m.position.x,g+1,f.m.position.z,.7,0xffffff);
      puff(f.m.position.x,g+2.5,f.m.position.z,.6,0xf4f8fd);
      f.bounces++;
      if(f.bounces>3||RND()<.22){f.active=false;f.m.visible=false;f.wait=(1+RND()*4)/(.3+act);return;}
      f.vel.y*=-.38;f.vel.x=f.vel.x*.65+(RND()-.5)*12;f.vel.z=f.vel.z*.65+(RND()-.5)*12;
    }
    if(f.m.position.y<camera.position.y-260){f.active=false;f.m.visible=false;f.wait=(1+RND()*4)/(.3+act);}
  });
  rockRumble=clamp(1-minD/110,0,1)*act;
  /* debu ambient merayap di dinding face */
  if(act>.2&&RND()<act*.3){
    var ch2=chutes[(RND()*chutes.length)|0];
    puff(ch2.pos.x+(RND()-.5)*24,ch2.pos.y+3,ch2.pos.z+(RND()-.5)*24,1.5);
  }
  /* umur debu: membesar + memudar + hanyut angin */
  for(var i=0;i<PUFF_N;i++){
    var pf=puffs[i];
    if(pf.life>pf.max){pf.s.material.opacity=0;continue;}
    pf.life+=dt;
    var t=clamp(pf.life/pf.max,0,1);
    var sc=(7+t*24)*(pf.big||1);
    pf.s.scale.set(sc,sc,1);
    pf.s.material.opacity=(1-t)*.4*Math.max(act,.15);
    pf.s.position.x+=wind*.9*dt;pf.s.position.y+=3.5*dt;
  }
}
/* bayangan hanya utk mesh solid (hemat perf, skip points/sky/glow) */
scene.traverse(function(o){
  if(o.isMesh&&o!==skyDome&&o!==cloudSea&&o!==sunMesh&&o!==sunHalo&&o!==moonMesh&&o!==footMesh){o.castShadow=true;o.receiveShadow=true;}
  if(o.isInstancedMesh&&o!==footMesh){o.castShadow=true;o.receiveShadow=true;}
});
footMesh.castShadow=false;footMesh.receiveShadow=false;
terrain.receiveShadow=true;terrain.castShadow=true;
/* garis/pool cahaya jangan bikin bayangan */
rope.castShadow=false;pole.castShadow=true;
climbers.forEach(function(c){c.beam.castShadow=false;c.beam.receiveShadow=false;});

/* ---------- UI ---------- */
var altN=document.getElementById('altN'),altG=document.getElementById('altG'),altO2=document.getElementById('altO2'),
    tagN=document.getElementById('tagN'),tagT=document.getElementById('tagT'),
    hint=document.getElementById('hint'),hintT=document.getElementById('hintT'),descend=document.getElementById('descend'),
    descendT=document.getElementById('descendT'),altUnit=document.getElementById('altUnit'),
    wIcon=document.getElementById('wIcon'),wText=document.getElementById('wText'),
    btnSound=document.getElementById('btnSound'),btnDayNight=document.getElementById('btnDayNight'),btnLang=document.getElementById('btnLang'),
    chEls=Array.prototype.slice.call(document.querySelectorAll('.ch'));
function applyLang(){
  var D=I18N[LANG];
  altUnit.textContent=D.unit;hintT.textContent=D.hint;descendT.textContent=D.descend;
  document.documentElement.lang=LANG;
  document.querySelectorAll('.ch-s').forEach(function(el,i){el.textContent=D.subs[i];});
  document.querySelectorAll('.ch-p').forEach(function(el,i){el.textContent=D.paras[i];});
  curCh=-1; /* paksa refresh weather */
  btnLang.innerHTML=(LANG==='id'?'ID | EN':'EN | ID');
}
btnLang.addEventListener('click',function(){LANG=(LANG==='id'?'en':'id');applyLang();});
applyLang();
chEls.forEach(function(el){var t=el.querySelector('.ch-t');var txt=t.getAttribute('data-text')||t.textContent;t.innerHTML='';txt.split('').forEach(function(ch){var s=document.createElement('span');s.className='l';s.textContent=ch===' ' ? '\u00A0':ch;t.appendChild(s);});});

/* route nav */
var routeBtns=document.getElementById('routeBtns'),routeLine=document.getElementById('routeLine'),routeDone=document.getElementById('routeDone'),routeMark=document.getElementById('routeMark');
var labels=['Basecamp','Icefall','Cwm','Face','8K','Summit'];
var pts=[];for(var pi=0;pi<6;pi++){var px=48-38*Math.sin(pi/5*PI*.9),py=620-pi/5*590;pts.push([px,py]);}
function pathFrom(p){return 'M'+p.map(function(q){return q[0].toFixed(1)+' '+q[1].toFixed(1);}).join(' L');}
routeLine.setAttribute('d',pathFrom(pts));routeDone.setAttribute('d',pathFrom(pts));
var totalLen=routeDone.getTotalLength?1200:1200;
var btns=labels.map(function(L,i){
  var a=document.createElement('a');a.href='#s'+i;a.innerHTML='<span>'+L+'</span><span class="tick"></span>';
  a.style.top=(pts[i][1]/640*100)+'%';a.addEventListener('click',function(e){e.preventDefault();document.getElementById('s'+i).scrollIntoView({behavior:'smooth'});});
  routeBtns.appendChild(a);return a;
});
routeDone.style.strokeDasharray=totalLen+' '+totalLen;routeDone.style.strokeDashoffset=totalLen;

function altitudeAtP(p){
  var seg=p*6,ci=Math.min(5,Math.floor(seg)),f=seg-ci;
  return lerp(ALT_M[ci],ALT_M[ci+1],smooth(0,1,f));
}
var cur=0,curCh=-1,shownAlt=5364;
function fmt(n){return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}

function updateUI(p){
  var seg=p*6,ci=clamp(Math.floor(seg+.15),0,5);
  var target=altitudeAtP(p);
  shownAlt+=(target-shownAlt)*.12;
  altN.textContent=fmt(shownAlt);
  altG.textContent='↑ '+fmt(Math.max(0,shownAlt-5364));
  altO2.textContent='O₂ '+Math.round(lerp(100,28,p))+'%';
  if(ci!==curCh){
    curCh=ci;tagN.textContent=CHAPTERS[ci].n;tagT.textContent=CHAPTERS[ci].t;
    wIcon.textContent=CHAPTERS[ci].icon;wText.textContent=I18N[LANG].w[ci];
    btns.forEach(function(b,i){b.setAttribute('data-on',i===ci?'1':'0');});
  }
  /* chapter fade + efek naik huruf */
  chEls.forEach(function(el,i){
    var local=seg-i; /* 0..1 saat aktif */
    var op=clamp(1-Math.abs(seg-i-.5)*1.6,0,1);
    el.style.opacity=op.toFixed(3);
    var ls=el.querySelectorAll('.l');
    for(var k=0;k<ls.length;k++){
      var kk=ls[k];
      var drift=(1-op)*30+k*2;
      kk.style.transform='translateY('+(drift*.4).toFixed(1)+'px)';
      kk.style.opacity=clamp(op*1.4-k*.04,0,1).toFixed(2);
    }
  });
  hint.style.opacity=p<.04?1:0;
  descend.setAttribute('data-on',p>.92?'1':'0');
  routeDone.style.strokeDashoffset=(totalLen*(1-p)).toFixed(1);
  routeMark.style.top=( (620-p*590)/640*100)+'%';
}

/* ---------- CAMERA + WEATHER ---------- */
var camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),firstFrame=true;
var cA=new THREE.Color(),cB=new THREE.Color(),fogC=new THREE.Color();
function applyEnv(p,time){
  var seg=p*6,ci=clamp(Math.floor(seg),0,5),f=sat(seg-ci);
  var A=CHAPTERS[ci],B=CHAPTERS[Math.min(5,ci+1)];
  cA.setHex(A.sky).lerp(cB.setHex(B.sky),smooth(0,1,f));
  scene.background.copy(cA);
  fogC.setHex(A.fog).lerp(new THREE.Color(B.fog),smooth(0,1,f));
  scene.fog.color.copy(fogC);
  var sunI=lerp(A.sunI,B.sunI,f);
  sun.intensity=sunI;
  sun.color.setHex(A.sun).lerp(new THREE.Color(B.sun),f);
  hemi.intensity=lerp(.9,.35,smooth(.6,.85,p))+ .25;
  var wind=lerp(A.wind,B.wind,f);
  var snowOp=lerp(A.snow,B.snow,f)*.9+.1;
  var starOp=smooth(.62,.78,p)*(1-smooth(.9,1,p)*.8);
  /* faktor badai: 0 di BC, naik di icefall, maksimal face->8K, reda di summit */
  var stormF=smooth(.08,.25,p)*(1-smooth(.9,.99,p)*.55)+smooth(.45,.65,p)*.6;
  stormF=clamp(stormF,0,1.2);
  /* whiteout BC->Icefall seperti screenshot: kabut super padat */
  var whiteout=smooth(.06,.14,p)*(1-smooth(.28,.42,p));
  var fogNear=lerp(220,120,smooth(.5,.8,p));
  var fogFar=lerp(2600,3200,smooth(.2,.5,p))*(1-smooth(.5,.75,p)*.45);
  fogNear=lerp(fogNear,40,whiteout);fogFar=lerp(fogFar,550,whiteout);
  fogFar*=(1-stormF*.35);
  /* override siang/malam */
  if(dayNight==='day'){sunI*=1.4;hemi.intensity+=.3;starOp=0;snowOp*=.7;}
  if(dayNight==='night'){sunI*=.2;hemi.intensity*=.45;cA.multiplyScalar(.32);fogC.multiplyScalar(.3);starOp=Math.max(starOp,.85);snowOp=Math.min(1,snowOp+.2);}
  scene.background.copy(cA);
  scene.fog.color.copy(fogC);
  /* sky dome gradient: atas = sky, bawah = fog terang */
  skyUni.topColor.value.copy(cA);
  skyUni.botColor.value.copy(fogC).lerp(new THREE.Color(0xF2F7A0),smooth(.7,1,p)*.45);
  sun.intensity=sunI;
  renderer.toneMappingExposure=lerp(1.02,1.22,smooth(.7,1,p))*(dayNight==='night'?.85:1);
  snowMat.opacity=clamp(snowOp+stormF*.25,0,1);
  stormMat.opacity=clamp(stormF*.75,0,.85);
  fogMat.opacity=clamp(.12+whiteout*.55+stormF*.15,0,.75);
  fogMat.color.copy(fogC);
  clMat.opacity=lerp(.1,.3,smooth(.3,.6,p));
  stMat.opacity=starOp;
  stars.rotation.y=time*.005;
  /* es memantulkan cahaya biru di icefall */
  iceLight.intensity=smooth(.08,.18,p)*(1-smooth(.35,.5,p))*1.4+stormF*.3;
  /* matahari: siang + auto = muncul di summit, malam = mati */
  var isNight=(dayNight==='night');
  var dayBright=isNight?.12:1;
  var sunV=smooth(.82,1,p)*dayBright;
  var pulse=1+Math.sin(time*1.7)*.04+Math.sin(time*4.3)*.015;
  sunMesh.material.opacity=sunV;
  sunMesh.scale.setScalar(pulse*(1+p*.3));
  sunMesh.lookAt(camera.position);
  sunHalo.material.opacity=sunV*.5;
  sunHalo.scale.set(700*pulse,700*pulse,1);
  sunGlow.material.opacity=sunV*(.4+Math.sin(time*.9)*.08);
  sunGlow.scale.set(1600*pulse,1600*pulse,1);
  /* flare ghosts di garis matahari-kamera */
  var fx=sunMesh.position.x*.3+camera.position.x*.7;
  var fy=sunMesh.position.y*.3+camera.position.y*.7;
  var fz=sunMesh.position.z*.3+camera.position.z*.7;
  flare1.position.set(fx,fy,fz);flare1.material.opacity=sunV*.3;
  flare2.position.set(
    sunMesh.position.x*.55+camera.position.x*.45,
    sunMesh.position.y*.55+camera.position.y*.45,
    sunMesh.position.z*.55+camera.position.z*.45);
  flare2.material.opacity=sunV*.22;
  summitLight.intensity=sunV*2.2;
  /* bulan: hanya mode malam */
  var nightF=isNight?1:0;
  moonMesh.material.opacity=nightF*.95;
  moonHalo.material.opacity=nightF*.5;
  moonLight.intensity=nightF*1.1;
  if(nightF>.1)summitLight.color.setHex(0xbcd0ff);else summitLight.color.setHex(0xF2F7A0);
  if(nightF>.1)summitLight.intensity=Math.max(summitLight.intensity,nightF*1.2);
  moonMesh.lookAt(camera.position);
  cloudSeaMat.opacity=smooth(.45,.8,p)*.92;
  cloudSea.position.y=lerp(300,640,smooth(.4,1,p));
  scene.fog.near=fogNear;
  scene.fog.far=fogFar;
  /* simpan untuk tick */
  applyEnv._storm=stormF;applyEnv._whiteout=whiteout;
  return wind+stormF*22;
}
function updateCamera(p,time,wind,speed){
  speed=speed||0;
  var u=clamp(p,0,1)*.985+.005;
  var pos=curve.getPointAt(u),ahead=curve.getPointAt(clamp(u+.022,0,1));
  var dir=new THREE.Vector3().subVectors(ahead,pos);dir.y=0;dir.normalize();
  var side=new THREE.Vector3(-dir.z,0,dir.x);
  var wide=1-smooth(.55,.9,p);           /* lebar di bawah, rapat di atas */
  var off=side.multiplyScalar(lerp(26,60,wide));
  off.y=lerp(14,44,wide);
  var shake=wind*.06+speed*3+rockRumble*5;
  var tp=pos.clone().add(off);
  tp.x+=Math.sin(time*1.3)*shake;tp.y+=Math.sin(time*1.7)*shake*.6;
  /* head-bob vertikal saat mendaki + dolly-in halus saat laju */
  tp.y+=Math.sin(time*2.2)*speed*2.5;
  tp.addScaledVector(dir,-speed*10);
  var tl=ahead.clone();tl.y+=lerp(6,18,wide)+speed*6;
  if(firstFrame){camPos.copy(tp);camLook.copy(tl);firstFrame=false;}
  camPos.lerp(tp,.06+speed*.06);camLook.lerp(tl,.08);
  camera.position.copy(camPos);camera.lookAt(camLook);
}

/* ---------- SUARA ANGIN (Web Audio prosedural, tanpa file) ---------- */
var audioOn=false,actx=null,windGain=null,windFilter=null,windLFO=null;
function initAudio(){
  actx=new (window.AudioContext||window.webkitAudioContext)();
  var len=actx.sampleRate*2,buf=actx.createBuffer(1,len,actx.sampleRate),d=buf.getChannelData(0);
  for(var i=0;i<len;i++)d[i]=Math.random()*2-1;
  var src=actx.createBufferSource();src.buffer=buf;src.loop=true;
  windFilter=actx.createBiquadFilter();windFilter.type='bandpass';windFilter.frequency.value=400;windFilter.Q.value=.6;
  windGain=actx.createGain();windGain.gain.value=0;
  windLFO=actx.createOscillator();windLFO.frequency.value=.13;
  var lfoGain=actx.createGain();lfoGain.gain.value=180;
  windLFO.connect(lfoGain);lfoGain.connect(windFilter.frequency);
  src.connect(windFilter);windFilter.connect(windGain);windGain.connect(actx.destination);
  src.start();windLFO.start();
}
btnSound.addEventListener('click',function(){
  if(!actx)initAudio();
  if(actx.state==='suspended')actx.resume();
  audioOn=!audioOn;
  btnSound.classList.toggle('on',audioOn);
  btnSound.innerHTML=(audioOn?'🔊 <span>'+I18N[LANG].soundOn+'</span>':'🔇 <span>'+I18N[LANG].soundOff+'</span>');
  if(!audioOn&&windGain)windGain.gain.setTargetAtTime(0,actx.currentTime,.4);
});
/* sinkron label suara saat ganti bahasa */
var _applyLang=applyLang;
applyLang=function(){_applyLang();btnSound.innerHTML=(audioOn?'🔊 <span>'+I18N[LANG].soundOn+'</span>':'🔇 <span>'+I18N[LANG].soundOff+'</span>');};

/* ---------- MODE SIANG / MALAM ---------- */
var dayNight='auto'; /* auto -> day -> night -> auto */
var DN_LABEL={auto:'◐ <span>Auto</span>',day:'☀ <span>Siang</span>',night:'☾ <span>Malam</span>'};
btnDayNight.addEventListener('click',function(){
  dayNight=dayNight==='auto'?'day':dayNight==='day'?'night':'auto';
  btnDayNight.innerHTML=DN_LABEL[dayNight];
  btnDayNight.classList.toggle('on',dayNight!=='auto');
  document.body.classList.toggle('night',dayNight==='night');
  document.body.classList.toggle('day',dayNight==='day');
});

/* ---------- LOOP ---------- */
var clock=new THREE.Clock(),mx=0,my=0,scrollVel=0,scrollDir=0;
window.addEventListener('pointermove',function(e){mx=(e.clientX/window.innerWidth-.5);my=(e.clientY/window.innerHeight-.5);});
function progress(){
  var max=scrollEl.scrollHeight-scrollEl.clientHeight;
  return max<=0?0:clamp(scrollEl.scrollTop/max,0,1);
}
function tick(){
  requestAnimationFrame(tick);
  var dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime;
  var raw=progress();
  /* auto-gerak: mulai setelah 8 dtk tak disentuh, ping-pong naik-turun */
  var nowMs=Date.now(),idleSec=(nowMs-lastInteract)/1000;
  if(autoActive&&idleSec<=AUTO_DELAY){autoActive=false;scrollEl.style.scrollBehavior='';}
  if(!autoActive&&idleSec>AUTO_DELAY&&!document.hidden){
    autoActive=true;autoDir=raw>=0.999?-1:(raw<=0.001?1:autoDir);
    scrollEl.style.scrollBehavior='auto';
  }
  if(autoActive){
    var maxS=scrollEl.scrollHeight-scrollEl.clientHeight,range=maxS>0?maxS:1;
    var spd=(range/55)*Math.min(1,(idleSec-AUTO_DELAY)/2+.2); /* ease-in, full trip ~55 dtk */
    var nt=scrollEl.scrollTop+autoDir*spd*dt;
    if(nt>=range-2){nt=range;autoDir=-1;}
    if(nt<=2){nt=0;autoDir=1;}
    lastAutoDrive=Date.now();scrollEl.scrollTop=nt;
    raw=range>0?clamp(nt/range,0,1):0;
  }
  /* peringatan */
  if(autoActive){autoWarnEl.classList.add('show');autoWarnEl.classList.add('on');autoWarnT.textContent=I18N[LANG].autoOn;}
  else if(idleSec>AUTO_DELAY-3){autoWarnEl.classList.add('show');autoWarnEl.classList.remove('on');autoWarnT.textContent=I18N[LANG].autoWarn.replace('{s}',Math.ceil(AUTO_DELAY-idleSec));}
  else{autoWarnEl.classList.remove('show');autoWarnEl.classList.remove('on');}
  var prevCur=cur;
  var p=cur+(raw-cur)*.08;cur=p;
  /* kecepatan scroll mentah -> efek realistis (arah + laju) */
  var instVel=(p-prevCur)/Math.max(dt,1e-3); /* >0 naik, <0 turun */
  scrollVel+=(instVel-scrollVel)*.12;
  var speed=Math.min(Math.abs(scrollVel)*3,1); /* 0..1 */
  scrollDir=scrollVel>0.0005?1:scrollVel<-0.0005?-1:0;
  var wind=applyEnv(p,time);
  updateCamera(p,time,wind,speed);
  /* langit + bayangan mengikuti kamera */
  skyDome.position.copy(camera.position);
  sun.position.set(camera.position.x-600,camera.position.y+800,camera.position.z-400);
  sun.target.position.copy(camera.position);sun.target.updateMatrixWorld();
  /* FOV kick saat scroll cepat + roll halus */
  var targetFov=58+speed*9;
  if(Math.abs(camera.fov-targetFov)>.05){camera.fov+=(targetFov-camera.fov)*.1;camera.updateProjectionMatrix();}
  camera.rotation.z+=clamp(-scrollVel*.35,-.06,.06)*.5;
  /* vignette berdenyut saat laju */
  var vg=document.getElementById('vignette');
  if(vg)vg.style.opacity=(.55+speed*.45).toFixed(2);
  /* suara angin mengikuti ketinggian */
  if(audioOn&&actx&&windGain){
    var gTarget=clamp(wind/40,0.04,1)*.5;
    windGain.gain.setTargetAtTime(gTarget,actx.currentTime,.3);
    windFilter.frequency.setTargetAtTime(280+wind*28+Math.sin(time*.5)*120,actx.currentTime,.3);
  }
  /* salju jatuh + angin + gust saat scroll */
  var arr=snowGeo.attributes.position.array;
  var cx=camera.position.x,cy=camera.position.y,cz=camera.position.z;
  var gust=1+speed*4;
  for(var i=0;i<SNOW_N;i++){
    arr[i*3+1]-=snowVel[i]*dt*(1+wind*.03)*gust + Math.abs(scrollVel)*900*dt;
    arr[i*3]+= (wind*.6+Math.sin(time+i)*3)*dt+mx*8*dt - scrollDir*speed*60*dt;
    arr[i*3+2]+=Math.cos(time*.7+i)*3*dt;
    if(arr[i*3+1]<cy-160){arr[i*3+1]=cy+320+Math.random()*80;arr[i*3]=cx+(Math.random()-.5)*900;arr[i*3+2]=cz+(Math.random()-.5)*900;}
    if(arr[i*3]>cx+450)arr[i*3]-=900;if(arr[i*3]<cx-450)arr[i*3]+=900;
    if(arr[i*3+2]>cz+450)arr[i*3+2]-=900;if(arr[i*3+2]<cz-450)arr[i*3+2]+=900;
  }
  snowGeo.attributes.position.needsUpdate=true;
  var ca=clGeo.attributes.position.array;
  for(var j=0;j<CL_N;j++){ca[j*3]+=dt*(6+wind*.5);if(ca[j*3]>1300)ca[j*3]-=2600;}
  clGeo.attributes.position.needsUpdate=true;
  spkMat.opacity=.3+.2*Math.sin(time*2.3)+speed*.08;
  /* badai streak: melesat horizontal, recycle di sekitar kamera */
  var stormF2=applyEnv._storm||0;
  var sa=stormGeo.attributes.position.array;
  for(var st=0;st<STORM_N;st++){
    sa[st*3]+=stormSpd[st]*dt*(0.4+stormF2)*(1+speed*2);
    sa[st*3+1]+=Math.sin(time*2+st)*14*dt*stormF2;
    if(sa[st*3]>cx+520){sa[st*3]=cx-520-Math.random()*120;sa[st*3+1]=cy+(Math.random()-.4)*420;sa[st*3+2]=cz+(Math.random()-.5)*1000;}
  }
  stormGeo.attributes.position.needsUpdate=true;
  /* kabut tanah menyapu BC->icefall */
  var fa=fogGeo.attributes.position.array;
  for(var fi2=0;fi2<FOG_N;fi2++){
    fa[fi2*3]+=dt*(10+wind*1.2+stormF2*40);
    fa[fi2*3+1]+=Math.sin(time*.6+fogSeed[fi2])*4*dt;
    if(fa[fi2*3]>-280)fa[fi2*3]-=780;
  }
  fogGeo.attributes.position.needsUpdate=true;
  /* bendera kain berkibar realistis: kibas + puntir per-bendera */
  for(var k=0;k<flagMeshes.length;k++){
    var fmk=flagMeshes[k],ph=flagPhase[k]||0;
    var amp=.35+wind*.012+speed*.5+stormF2*.3;
    fmk.rotation.y=Math.sin(time*(2.2+wind*.06+stormF2*3)+ph)*amp+mx*.6;
    fmk.rotation.x=Math.sin(time*3.1+ph*1.7)*.28*(1+speed+stormF2);
    fmk.rotation.z=Math.sin(time*1.6+ph)*.12;
    var sc=1+Math.sin(time*5+ph)*.04*speed;
    fmk.scale.set(sc,1,1);
  }
  /* bendera summit CLOTH-SIM: gelombang menjalar dari tiang ke ujung */
  var stormW=stormF2*1.4+speed*.8;
  var summitW=clamp(2.5+wind*.09+stormW*7,2.5,16); /* frekuensi kibaran */
  var summitA=clamp(.35+wind*.02+stormW*1.3,.35,3.2); /* amplitudo */
  var sp=sflagGeo.attributes.position;
  for(var vi2=0;vi2<sp.count;vi2++){
    var bx=sflagBase[vi2*3],by=sflagBase[vi2*3+1];
    var pin=clamp(bx/11,0,1); /* 0 di tiang, 1 di ujung */
    var wave=Math.sin(bx*.9-time*summitW+by*.5)*summitA*pin;
    var wave2=Math.sin(bx*1.7-time*summitW*1.6+by*1.1)*summitA*.45*pin;
    sp.setZ(vi2,wave+wave2);
    sp.setY(vi2,by+Math.sin(bx*.6-time*summitW*.7)*summitA*.3*pin);
  }
  sp.needsUpdate=true;sflagGeo.computeVertexNormals();
  sflag.rotation.y=Math.sin(time*1.2)*.25+Math.sin(time*(3+stormW*4))*.3;
  pole.rotation.z=Math.sin(time*(2+stormW*3))*.008*summitA;
  /* matahari berdenyut + bulan */
  sunGlow.material.rotation=(sunGlow.material.rotation||0)+dt*.05;
  moonHalo.material.opacity+=(Math.sin(time*1.2)*.05-0)*dt;
  /* lampu tenda flicker halus seperti api */
  tentLight1.intensity=1.5+Math.sin(time*9)*.12+Math.sin(time*23)*.08;
  tentLight2.intensity=.85+Math.sin(time*11+2)*.1;
  updateRockfall(p,dt,wind);
  updateClimbers(p,time,wind,speed);
  updateUI(p);
  renderer.render(scene,camera);
}
/* ---------- AUTO-GERAK saat idle: jalan sendiri jika tak disentuh ---------- */
var AUTO_DELAY=8,lastInteract=Date.now(),lastAutoDrive=0,autoActive=false,autoDir=1;
var autoWarnEl=document.getElementById('autoWarn'),autoWarnT=document.getElementById('autoWarnT');
scrollEl.addEventListener('scroll',function(){
  if(autoActive&&(Date.now()-lastAutoDrive)<150)return; /* scroll dari mesin, abaikan */
  lastInteract=Date.now();
},{passive:true});
['pointerdown','wheel','touchstart','keydown'].forEach(function(ev){
  window.addEventListener(ev,function(){lastInteract=Date.now();},{passive:true});
});
descend.addEventListener('click',function(){scrollEl.scrollTo({top:0,behavior:'smooth'});});
window.addEventListener('resize',function(){camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});

/* ---------- BOOT ---------- */
var boot=document.getElementById('boot'),bar=boot.querySelector('#bootBar i'),bs=document.getElementById('bootS');
var msgs=['Membaca rute…','Membangun gunung…','Menabur salju…','Mengatur cuaca…','Siap mendaki'];
var bi=0;var bint=setInterval(function(){bi++;bar.style.width=(bi/msgs.length*100)+'%';bs.textContent=msgs[Math.min(bi,msgs.length-1)];if(bi>=msgs.length){clearInterval(bint);boot.setAttribute('data-done','1');hint.style.opacity=1;lastInteract=Date.now();}},350);
updateUI(0);
tick();
})();
