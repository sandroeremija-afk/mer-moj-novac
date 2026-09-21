(function exposeAssistantVoice(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MerAssistantVoice=api;
})(typeof globalThis==='undefined'?this:globalThis,function createAssistantVoiceModule(){
  'use strict';
  const SVG_NS='http://www.w3.org/2000/svg';
  const copy={
    hr:{start:'Glasovni unos na hrvatskom',stop:'Zaustavi mikrofon',starting:'Pokrećem mikrofon…',listening:'Slušam…',stopping:'Zaustavljam mikrofon…',ready:'Tekst je spreman. Provjerite ga pa pritisnite Pošalji.',privacy:'Glas obrađuje usluga preglednika. Poruku šaljete sami.',unsupported:'Glasovni unos nije podržan u ovom pregledniku. Poruku možete upisati.',denied:'Mikrofon nije dopušten. Omogućite ga u postavkama preglednika ili upišite poruku.',noSpeech:'Govor nije prepoznat. Pokušajte ponovno ili upišite poruku.',network:'Govorna usluga nije dostupna. Provjerite vezu ili upišite poruku.',audio:'Mikrofon nije dostupan. Provjerite uređaj ili upišite poruku.',stopped:'Glasovni unos je zaustavljen. Tekst nije poslan.',play:'Pročitaj odgovor',stopRead:'Zaustavi čitanje',speechUnsupported:'Čitanje naglas nije dostupno. Odgovor ostaje prikazan kao tekst.',speechError:'Čitanje je zaustavljeno. Odgovor možete pročitati na zaslonu.'},
    en:{start:'Voice input in Croatian',stop:'Stop microphone',starting:'Starting microphone…',listening:'Listening…',stopping:'Stopping microphone…',ready:'Your text is ready. Review it, then press Send.',privacy:'Your browser service processes speech. You send the message yourself.',unsupported:'Voice input is unavailable in this browser. You can type your message.',denied:'Microphone permission was denied. Enable it in browser settings or type your message.',noSpeech:'No speech was recognized. Try again or type your message.',network:'The speech service is unavailable. Check your connection or type your message.',audio:'The microphone is unavailable. Check your device or type your message.',stopped:'Voice input stopped. Your text was not sent.',play:'Read response aloud',stopRead:'Stop reading',speechUnsupported:'Reading aloud is unavailable. The response remains available as text.',speechError:'Reading stopped. You can read the response on screen.'}
  };
  function create(options={}){
    const host=options.host||globalThis,document=options.document||host.document;
    if(!document)return null;
    const surfaces=[],listeners=[],timers=new Set();
    const owner=()=>String(options.getOwner?.()||'');
    const text=key=>(copy[options.getLanguage?.()==='en'?'en':'hr'][key]||'');
    let active=null,playback=null,serial=0,lastOwner=owner(),destroyed=false;
    const schedule=(callback,delay)=>{const id=host.setTimeout(()=>{timers.delete(id);callback();},delay);timers.add(id);return id;};
    const clearTimer=id=>{if(id){host.clearTimeout(id);timers.delete(id);}};
    const visible=surface=>!destroyed&&Boolean(owner())&&!document.hidden&&surface.root?.isConnected!==false&&surface.input?.isConnected!==false&&surface.isVisible?.()!==false;
    function bind(target,event,handler){target?.addEventListener?.(event,handler);listeners.push(()=>target?.removeEventListener?.(event,handler));}
    function icon(kind){
      const svg=document.createElementNS(SVG_NS,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
      const paths=kind==='mic'?['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z','M5 10v2a7 7 0 0 0 14 0v-2','M12 19v3','M8 22h8']:['M11 5 6 9H3v6h3l5 4V5Z','M15.5 8.5a5 5 0 0 1 0 7','M19 5a10 10 0 0 1 0 14'];
      paths.forEach(value=>{const path=document.createElementNS(SVG_NS,'path');path.setAttribute('d',value);svg.append(path);});return svg;
    }
    function announce(surface,key,error=false){
      if(!surface?.voiceStatus)return;
      surface.voiceStatus.textContent=text(key);surface.voiceStatus.hidden=!key;surface.voiceStatus.classList.toggle('is-error',error);surface.voiceStatus.setAttribute('role',error?'alert':'status');
    }
    function renderSurface(surface){
      const recording=active?.surface===surface;
      surface.micButton.setAttribute('aria-label',text(recording?'stop':'start'));
      surface.micButton.setAttribute('title',text(recording?'stop':'start'));
      surface.micButton.setAttribute('aria-pressed',String(recording));
      surface.micButton.classList.toggle('is-listening',recording);
      if(surface.stopLabel.hidden!==!recording)surface.stopLabel.hidden=!recording;
      if(surface.micIcon.hasAttribute('hidden')!==recording)surface.micIcon.toggleAttribute('hidden',recording);
      surface.micButton.disabled=!recording&&Boolean(surface.send?.disabled);
      if(surface.voiceHint.textContent!==text('privacy'))surface.voiceHint.textContent=text('privacy');
    }
    function releaseRecognition(job,{abort=true,key='',error=false}={}){
      if(active!==job)return;
      active=null;serial++;
      clearTimer(job.timer);clearTimer(job.stopTimer);
      const recognition=job.recognition;
      recognition.onstart=recognition.onresult=recognition.onerror=recognition.onend=recognition.onnomatch=null;
      if(abort){try{recognition.abort();}catch{}}
      renderSurface(job.surface);announce(job.surface,key,error);
    }
    function valid(job){return active===job&&job.serial===serial&&job.owner===owner()&&visible(job.surface);}
    function stopRecognition({complete=false,key='stopped'}={}){
      const job=active;if(!job)return;
      if(complete&&valid(job)&&!job.stopping){
        job.stopping=true;announce(job.surface,'stopping');
        try{job.recognition.stop();if(active===job)job.stopTimer=schedule(()=>releaseRecognition(job,{key:job.heard?'ready':key}),1500);}catch{releaseRecognition(job,{key});}
      }else releaseRecognition(job,{key});
    }
    function stopPlayback(){
      const job=playback;if(!job)return;
      playback=null;job.utterance.onend=job.utterance.onerror=null;
      try{host.speechSynthesis?.cancel();}catch{}
      if(job.button){job.button.setAttribute('aria-pressed','false');job.button.setAttribute('aria-label',text('play'));job.label.textContent=text('play');}
    }
    function stopAll({clearDrafts=false}={}){
      stopRecognition({key:''});stopPlayback();
      surfaces.forEach(surface=>{announce(surface,'');if(clearDrafts)surface.input.value='';});
    }
    function refresh(){
      const nextOwner=owner();
      if(nextOwner!==lastOwner){stopAll({clearDrafts:true});lastOwner=nextOwner;}
      if(active&&!valid(active))releaseRecognition(active,{key:''});
      if(playback&&(playback.owner!==nextOwner||!visible(playback.surface)||playback.button.isConnected===false))stopPlayback();
      surfaces.forEach(renderSurface);
    }
    function start(surface){
      refresh();
      if(active?.surface===surface){stopRecognition({complete:true});return;}
      if(!visible(surface)||surface.send?.disabled)return;
      stopAll();
      const Recognition=host.SpeechRecognition||host.webkitSpeechRecognition;
      if(!Recognition){announce(surface,'unsupported',true);surface.input.focus?.();return;}
      let recognition;
      try{recognition=new Recognition();}catch{announce(surface,'audio',true);return;}
      const job={recognition,surface,owner:owner(),serial:++serial,base:String(surface.input.value||''),heard:false,stopping:false};
      active=job;
      recognition.lang='hr-HR';recognition.continuous=false;recognition.interimResults=true;recognition.maxAlternatives=1;
      recognition.onstart=()=>{if(!valid(job)){releaseRecognition(job,{key:''});return;}announce(surface,'listening');};
      recognition.onresult=event=>{
        if(!valid(job)){releaseRecognition(job,{key:''});return;}
        const chunks=[];
        for(let index=0;index<(event.results?.length||0);index++){
          const transcript=event.results[index]?.[0]?.transcript;
          if(typeof transcript==='string')chunks.push(transcript.trim());
        }
        const transcript=chunks.filter(Boolean).join(' ');if(!transcript)return;
        job.heard=true;
        const separator=job.base&&!/\s$/.test(job.base)?' ':'';
        const maxLength=Number(surface.input.maxLength)>0?Number(surface.input.maxLength):1000;
        surface.input.value=(job.base+separator+transcript).slice(0,maxLength);
        surface.input.setSelectionRange?.(surface.input.value.length,surface.input.value.length);
      };
      recognition.onerror=event=>{
        if(!valid(job)){releaseRecognition(job,{key:''});return;}
        const code=event?.error,key=code==='not-allowed'||code==='service-not-allowed'?'denied':code==='no-speech'?'noSpeech':code==='network'?'network':code==='aborted'?'stopped':'audio';
        releaseRecognition(job,{key,error:code!=='aborted'});
      };
      recognition.onnomatch=()=>{if(valid(job))releaseRecognition(job,{key:'noSpeech',error:true});};
      recognition.onend=()=>{if(valid(job))releaseRecognition(job,{abort:false,key:job.heard?'ready':'noSpeech',error:!job.heard});else releaseRecognition(job,{key:''});};
      renderSurface(surface);announce(surface,'starting');
      try{recognition.start();if(active===job)job.timer=schedule(()=>stopRecognition({complete:true}),60000);}catch(error){releaseRecognition(job,{key:error?.name==='NotAllowedError'?'denied':'audio',error:true});}
    }
    function attach(surface){
      if(!surface?.form||!surface.input||surfaces.includes(surface))return;
      const mic=document.createElement('button');mic.type='button';mic.className='assistant-mic-button';mic.id=`${surface.input.id}Mic`;
      const micIcon=icon('mic'),stopLabel=document.createElement('span');stopLabel.className='assistant-mic-stop';stopLabel.setAttribute('aria-hidden','true');stopLabel.hidden=true;mic.append(micIcon,stopLabel);
      const meta=document.createElement('div');meta.className='assistant-voice-meta';
      const status=document.createElement('p');status.id=`${surface.input.id}VoiceStatus`;status.className='assistant-voice-status';status.hidden=true;status.setAttribute('role','status');status.setAttribute('aria-live','polite');
      const hint=document.createElement('p');hint.id=`${surface.input.id}VoiceHint`;hint.className='assistant-voice-hint';mic.setAttribute('aria-describedby',`${hint.id} ${status.id}`);
      meta.append(status,hint);surface.form.insertBefore(mic,surface.send);surface.form.after(meta);surface.form.classList.add('assistant-voice-enabled');
      Object.assign(surface,{micButton:mic,micIcon,stopLabel,voiceStatus:status,voiceHint:hint});surfaces.push(surface);
      bind(mic,'click',()=>start(surface));
      bind(surface.input,'input',()=>{if(active?.surface===surface)stopRecognition({key:'stopped'});});
      renderSurface(surface);
    }
    function messageButton(content,surface){
      const button=document.createElement('button'),label=document.createElement('span');button.type='button';button.className='assistant-read-button';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',text('play'));label.textContent=text('play');button.append(icon('speaker'),label);
      button.addEventListener('click',()=>{
        refresh();if(playback?.button===button){stopPlayback();return;}if(!visible(surface))return;
        stopAll();
        if(!host.speechSynthesis||!host.SpeechSynthesisUtterance){announce(surface,'speechUnsupported',true);return;}
        try{
          const utterance=new host.SpeechSynthesisUtterance(String(content||'').slice(0,4000));utterance.lang='hr-HR';utterance.rate=.95;
          const voices=host.speechSynthesis.getVoices?.()||[],voice=voices.find(item=>String(item.lang).toLowerCase()==='hr-hr')||voices.find(item=>/^hr(?:-|$)/i.test(item.lang));if(voice)utterance.voice=voice;
          const job={utterance,button,label,surface,owner:owner()};playback=job;
          button.setAttribute('aria-pressed','true');button.setAttribute('aria-label',text('stopRead'));label.textContent=text('stopRead');
          utterance.onend=()=>{if(playback===job)stopPlayback();};
          utterance.onerror=()=>{if(playback===job){stopPlayback();if(visible(surface))announce(surface,'speechError',true);}};
          host.speechSynthesis.speak(utterance);
        }catch{stopPlayback();announce(surface,'speechUnsupported',true);}
      });return button;
    }
    bind(document,'visibilitychange',()=>{if(document.hidden)stopAll();});
    bind(host,'pagehide',()=>stopAll());bind(host,'offline',()=>stopAll());bind(host,'mer-security-status',refresh);
    const observer=host.MutationObserver?new host.MutationObserver(()=>{if(active||playback)refresh();}):null;
    observer?.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open']});
    function destroy(){if(destroyed)return;stopAll();destroyed=true;observer?.disconnect();listeners.splice(0).forEach(remove=>remove());timers.forEach(id=>host.clearTimeout(id));timers.clear();}
    return Object.freeze({attach,refresh,stopAll,messageButton,destroy});
  }
  return Object.freeze({create});
});
