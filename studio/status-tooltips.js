let statusTip,statusTipAnchor,statusTipHideTimer,restoringStatusTipFocus=false;
function cancelStatusTipHide(){clearTimeout(statusTipHideTimer);}
function hideStatusTip(restoreFocus=false){
 const anchor=statusTipAnchor;
 cancelStatusTipHide();
 if(statusTip)statusTip.hidden=true;
 if(statusTipAnchor){statusTipAnchor.removeAttribute('aria-describedby');statusTipAnchor.setAttribute('aria-expanded','false');}
 statusTipAnchor=null;
 if(restoreFocus&&anchor?.isConnected){restoringStatusTipFocus=true;anchor.focus({preventScroll:true});restoringStatusTipFocus=false;}
}
function scheduleStatusTipHide(){cancelStatusTipHide();statusTipHideTimer=setTimeout(()=>{if(statusTipAnchor?.contains(document.activeElement)||statusTip?.contains(document.activeElement))return;hideStatusTip();},180);}
function showStatusTip(anchor){
 cancelStatusTipHide();
 if(statusTipAnchor===anchor&&statusTip&&!statusTip.hidden)return;
 hideStatusTip();hideAcronymTip();
 if(!statusTip){
  statusTip=document.createElement('div');statusTip.id='status-explanation-tooltip';statusTip.className='status-explanation-tooltip';statusTip.setAttribute('role','dialog');statusTip.setAttribute('aria-modal','false');statusTip.setAttribute('aria-labelledby','status-tooltip-heading');statusTip.tabIndex=-1;
  statusTip.addEventListener('mouseenter',cancelStatusTipHide);statusTip.addEventListener('mouseleave',scheduleStatusTipHide);
  statusTip.addEventListener('focusin',cancelStatusTipHide);statusTip.addEventListener('focusout',scheduleStatusTipHide);
  document.body.append(statusTip);
 }
 const labels={placement:'placement',eligibility:'eligibility',operating:'the operating model'};
 statusTip.innerHTML=`<div class="status-popup-heading"><strong id="status-tooltip-heading">${anchor.dataset.statusState==='conflict'?'What conflicts in '+esc(labels[anchor.dataset.statusKind]):'Why '+esc(labels[anchor.dataset.statusKind])+' is unresolved'}</strong><button type="button" class="status-popup-close" aria-label="Close explanation">×</button></div>${statusExplanationHtml(anchor.dataset.statusKind)}<p>Choose a link to review the relevant field or validation requirement. Press Escape or tap outside to close.</p>`;
 statusTip.hidden=false;statusTip.scrollTop=0;statusTipAnchor=anchor;
 anchor.setAttribute('aria-describedby',statusTip.id);anchor.setAttribute('aria-expanded','true');
 const rect=anchor.getBoundingClientRect(),tip=statusTip.getBoundingClientRect(),margin=8;
 const left=Math.max(margin,Math.min(rect.left,innerWidth-tip.width-margin));
 const preferredTop=rect.bottom+margin;
 const top=preferredTop+tip.height<=innerHeight-margin?preferredTop:Math.max(margin,rect.top-tip.height-margin);
 statusTip.style.left=left+'px';statusTip.style.top=top+'px';
}
document.addEventListener('mouseover',event=>{const anchor=event.target.closest('.status-explanation-trigger');if(anchor)showStatusTip(anchor);});
document.addEventListener('mouseout',event=>{
 const anchor=event.target.closest('.status-explanation-trigger');
 if(anchor&&!anchor.contains(event.relatedTarget)&&!statusTip?.contains(event.relatedTarget))scheduleStatusTipHide();
});
document.addEventListener('focusin',event=>{const anchor=event.target.closest('.status-explanation-trigger');if(anchor){if(!restoringStatusTipFocus)showStatusTip(anchor);}else if(!statusTip?.contains(event.target))hideStatusTip();});
document.addEventListener('focusout',event=>{if(event.target.closest('.status-explanation-trigger')&&!statusTip?.contains(event.relatedTarget))scheduleStatusTipHide();});
function jumpToRequirement(targetStep,targetId){
 hideStatusTip();go(Number(targetStep));
 const target=document.getElementById(targetId);
 if(!target)return;
 for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
 if(!target.matches('input,select,textarea,button,a,[tabindex]'))target.tabIndex=-1;
 target.classList.add('requirement-focus');
 target.scrollIntoView({behavior:'smooth',block:'center'});target.focus({preventScroll:true});
 setTimeout(()=>target.classList.remove('requirement-focus'),2200);
}
document.addEventListener('click',event=>{
 if(event.target.closest('.status-popup-close')){event.preventDefault();hideStatusTip(true);return;}
 const link=event.target.closest('.requirement-resolution-link');
 if(link){event.preventDefault();jumpToRequirement(link.dataset.requirementStep,link.dataset.requirementTarget);return;}
 const anchor=event.target.closest('.status-explanation-trigger');
 if(anchor){event.preventDefault();showStatusTip(anchor);statusTip.querySelector('a')?.focus({preventScroll:true});}
 else if(!statusTip?.contains(event.target))hideStatusTip();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){hideStatusTip(true);return;}
 const anchor=event.target.closest('.status-explanation-trigger');
 if(anchor&&event.key==='ArrowDown'){event.preventDefault();showStatusTip(anchor);statusTip.querySelector('a')?.focus({preventScroll:true});}
});
window.addEventListener('scroll',event=>{if(event.target===window||!statusTip?.contains(event.target))hideStatusTip();},true);
window.addEventListener('resize',()=>hideStatusTip());
