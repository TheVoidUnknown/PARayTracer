// Essentially just a lookup table
const Pi = Math.PI;
const Pi2 = Pi / 2.0;
const B1 = 1.0 / 2.75;
const B2 = 2.0 / 2.75;
const B3 = 1.5 / 2.75;
const B4 = 2.5 / 2.75;
const B5 = 2.25 / 2.75;
const B6 = 2.625 / 2.75;

const EaseFunctions = {
    Linear: (t) => t,
    instant: () => 0.0,
    
    InSine: (t) => (t === 1 ? 1 : -Math.cos(Pi2 * t) + 1),
    OutSine: (t) => Math.sin(Pi2 * t),
    InOutSine: (t) => -Math.cos(Pi * t) / 2 + 0.5,
    
    InElastic: (t) => Math.sin(13 * Pi2 * t) * Math.pow(2, 10 * (t - 1)),
    OutElastic: (t) => (t === 1 ? 1 : (Math.sin(-13 * Pi2 * (t + 1)) * Math.pow(2, -10 * t) + 1)),
    InOutElastic: (t) => {
        if (t < 0.5) {
            return 0.5 * Math.sin(13 * Pi2 * (2 * t)) * Math.pow(2, 10 * ((2 * t) - 1));
        }
        return 0.5 * (Math.sin(-13 * Pi2 * ((2 * t - 1) + 1)) * Math.pow(2, -10 * (2 * t - 1)) + 2);
    },
    
    InBack: (t) => t * t * (2.70158 * t - 1.70158),
    OutBack: (t) => 1 - (--t * t * (-2.70158 * t - 1.70158)),
    InOutBack: (t) => {
        t *= 2;
        return t < 1 ? (t * t * (2.70158 * t - 1.70158) / 2) : ((1 - (--t * t * (-2.70158 * t - 1.70158)) / 2) + 0.5);
    },
    
    InBounce: (t) => {
        t = 1 - t;
        if (t < B1) return 1 - 7.5625 * t * t;
        if (t < B2) return 1 - (7.5625 * (t - B3) * (t - B3) + 0.75);
        if (t < B4) return 1 - (7.5625 * (t - B5) * (t - B5) + 0.9375);
        return 1 - (7.5625 * (t - B6) * (t - B6) + 0.984375);
    },
    OutBounce: (t) => {
        if (t < B1) return 7.5625 * t * t;
        if (t < B2) return 7.5625 * (t - B3) * (t - B3) + 0.75;
        if (t < B4) return 7.5625 * (t - B5) * (t - B5) + 0.9375;
        return 7.5625 * (t - B6) * (t - B6) + 0.984375;
    },
    InOutBounce: (t) => {
        if (t < 0.5) {
            t = 1 - t * 2;
            if (t < B1) return (1 - 7.5625 * t * t) / 2;
            if (t < B2) return (1 - (7.5625 * (t - B3) * (t - B3) + 0.75)) / 2;
            if (t < B4) return (1 - (7.5625 * (t - B5) * (t - B5) + 0.9375)) / 2;
            return (1 - (7.5625 * (t - B6) * (t - B6) + 0.984375)) / 2;
        }

        t = t * 2 - 1;
        if (t < B1) return (7.5625 * t * t) / 2 + 0.5;
        if (t < B2) return (7.5625 * (t - B3) * (t - B3) + 0.75) / 2 + 0.5;
        if (t < B4) return (7.5625 * (t - B5) * (t - B5) + 0.9375) / 2 + 0.5;
        return (7.5625 * (t - B6) * (t - B6) + 0.984375) / 2 + 0.5;
    },

    InQuad: (t) => t * t,
    OutQuad: (t) => -t * (t - 2),
    InOutQuad: (t) => (t <= 0.5 ? t * t * 2 : 1 - (--t) * t * 2),

    InCirc: (t) => -(Math.sqrt(1 - t * t) - 1),
    OutCirc: (t) => Math.sqrt(1 - (t - 1) * (t - 1)),
    InOutCirc: (t) => (t <= 0.5 ? (Math.sqrt(1 - t * t * 4) - 1) / -2 : (Math.sqrt(1 - (t * 2 - 2) * (t * 2 - 2)) + 1) / 2),

    InExpo: (t) => Math.pow(2, 10 * (t - 1)),
    OutExpo: (t) => (t === 1 ? 1 : (-Math.pow(2, -10 * t) + 1)),
    InOutExpo: (t) => (t === 1 ? 1 : (t < 0.5 ? Math.pow(2, 10 * (t * 2 - 1)) / 2 : (-Math.pow(2, -10 * (t * 2 - 1)) + 2) / 2)),
};

function getEaseFunction(name) {
    return EaseFunctions[name] || null;
}

function getEaseFunctionOrDefault(name) {
    return EaseFunctions[name] || EaseFunctions["Linear"];
}

function toAndFro(easeFunction) {
    return (t) => toAndFroFunction(easeFunction(t));
}

function toAndFroFunction(t) {
    return t < 0.5 ? t * 2 : 1 + ((t - 0.5) / 0.5) * -1;
}

function interpolate(start, end, t, easeFunction) {
    const easedT = easeFunction(t);
    return start + (end - start) * easedT;
}

export { 
    EaseFunctions, 
    getEaseFunction, 
    getEaseFunctionOrDefault, 
    toAndFro, 
    toAndFroFunction, 
    interpolate 
}