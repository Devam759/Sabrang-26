const xTo = gsap.quickTo('.pov g', 'x', {duration:1, ease:'expo'});
const yTo = gsap.quickTo('.pov g', 'y', {duration:1, ease:'expo'});

const tl = gsap.timeline({
  scrollTrigger:{
    trigger:'#s',
    start:'0 0',
    end:'100% 100%',
    pin:'.map',
    scrub:1
  },
  onUpdate:()=>{
    xTo(-gsap.getProperty('.dot', 'x'));
    yTo(-gsap.getProperty('.dot', 'y'));
  }
}) 
.to('.dot', {motionPath:'.path', immediateRender:true, ease:'none'}, 0)
.from('.path', {drawSVG:'0 0', ease:'none'}, 0)
.fromTo('.pov', {x:750, y:750, scale:2}, {scale:4, ease:'sine.inOut', duration:0.15, yoyo:true, repeat:1, repeatDelay:0.2}, 0)

gsap.set('.pov g', {
  x:-gsap.getProperty('.dot', 'x'),
  y:-gsap.getProperty('.dot', 'y')
});


// Map Expand + Collapse Behavior
const section = document.querySelector('#s')
const expandMapBtn = document.querySelector('.expand-map')
const closeMapBtn = document.querySelector('.close-map')

expandMapBtn.addEventListener('click', ()=>{
  gsap.timeline()
    .set('body', {overflow:'hidden'})
    .to('.map', {width:'100%', maxWidth:'100%', ease:'power3.inOut'})
    .to(tl, {progress:1, ease:'power2.inOut'}, 0)
    .to(closeMapBtn, {autoAlpha:1}, 0.3)
})

closeMapBtn.addEventListener('click', ()=>{
  gsap.timeline()
    .to(closeMapBtn, {duration:0.2, autoAlpha:0})
    .to('.map', {width:'50%', maxWidth:'50%', ease:'expo.inOut'}, 0)
    .set('body', {overflow:'scroll'})
})

window.addEventListener('resize', ()=>{
  gsap.set(closeMapBtn, {autoAlpha:0})
  gsap.set('body', {overflow:'scroll'})
  ScrollTrigger.refresh()
})