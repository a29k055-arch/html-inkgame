// Immutable presets; A uses the archived solver unchanged. All share scene inputs.
export const HERO_PRESETS=Object.freeze({
 reference:Object.freeze({label:'A · 原版参考',life:1.5,maxLife:1.8,length:340,lengthPower:.65,width:.75,widthPower:.55,widthMax:58,opacity:.5,filaments:0,decay:null,feed:0}),
 single:Object.freeze({label:'B · 单尾水墨',life:1.6,maxLife:2.4,length:390,lengthPower:.85,width:.90,widthPower:.80,widthMax:100,opacity:.70,filaments:.015,decay:1.8,feed:.25}),
 comet:Object.freeze({label:'C · 彗星水墨',life:1.8,maxLife:2.8,length:460,lengthPower:.85,width:1.0,widthPower:.80,widthMax:112,opacity:.76,filaments:.035,decay:1.65,feed:.30}),
 fluid:Object.freeze({label:'D · 柔墨流体',life:1.7,maxLife:2.6,length:430,lengthPower:.80,width:.92,widthPower:.75,widthMax:104,opacity:.68,filaments:.025,decay:1.9,feed:.38})
});
export const DEFAULT_HERO_PRESET='single';
