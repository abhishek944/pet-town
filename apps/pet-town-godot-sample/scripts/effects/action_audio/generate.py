"""Bake source WebAudio action envelopes to PCM; no runtime synthesis stalls.
Source: pet-town-3d/src/audio/{sound-effects,synthesis}. Seeded noise variants.
Run with Python 3; outputs stereo 22050 Hz WAV files alongside this generator.
"""
import array
import math
from pathlib import Path
import random
import wave

RATE = 22050
TAU = math.tau
RNG = random.Random(72913)
OUT = Path(__file__).parent
SURFACES = dict(grass=3000, leaves=3200, dirt=900, sand=4200, stone=2300,
                gravel=2800, wood=1000, glass=5200, water=1500, snow=1800)
SCALE = [0, 2, 4, 7, 9]

def degree(value, base):
    return base + 12 * (value // 5) + SCALE[value % 5] - 12

def tone(f, peak, tau, start=0, f2=None, glide=.08, attack=.003, kind='sine', pan=0):
    return dict(f=f, peak=peak, tau=tau, start=start, f2=f2 or f,
                glide=glide, attack=attack, kind=kind, pan=pan)

def noise(f, peak, tau, start=0, q=1, color='white', filter='bandpass', sweep=None, attack=.003):
    return dict(f=f, peak=peak, tau=tau, start=start, q=q, kind='noise',
                color=color, filter=filter, sweep=sweep, attack=attack, pan=0)

def note(midi, volume, start=0, bell=False, pan=0):
    f = 440 * 2 ** ((midi - 69) / 12)
    decay = min(1.5, max(.28, .95 * (523 / f) ** .45)) if bell else min(.75, max(.09, .42 * (220 / f) ** .5))
    result = [tone(f, volume, decay, start, attack=.003 if bell else .0025, pan=pan)]
    result += [tone(f * (2 if bell else 3.93), volume * (.22 if bell else .28), decay * (.5 if bell else .16), start, attack=.002 if bell else .0015, pan=pan)]
    if bell and f * 6.27 < 11000:
        result += [tone(f * 6.27, volume * .1, .045, start, attack=.002, pan=pan)]
    if not bell:
        result += [noise(min(f * 2.2, 4000), volume * .06, .008, start, q=1.2, attack=.0015)]
    return result

def source_noise(color):
    state = [0.] * 8
    values = []
    for _ in range(RATE * 4 + round(RATE * .08)):
        white = RNG.uniform(-1, 1)
        if color == 'brown':
            state[7] = (state[7] + .02 * white) / 1.02
            value = state[7] * 3.2
        elif color == 'pink':
            for j, (a, b) in enumerate(zip([.99886,.99332,.969,.8665,.55,-.7616], [.0555179,.0750759,.153852,.3104856,.5329522,-.016898])):
                state[j] = a * state[j] + b * white
            value = (sum(state[:7]) + white * .5362) * .11
            state[6] = white * .115926
        else:
            value = white * .5
        values.append(value)
    for i in range(round(RATE * .08)):
        w = i / (RATE * .08)
        values[i] = values[i] * w + values[RATE * 4 + i] * (1-w)
    return values[:RATE * 4]

NOISE = {kind: source_noise(kind) for kind in ['white','pink','brown']}

def bake(name, parts):
    duration = max(p['start'] + p['attack'] + p['tau'] * 7 for p in parts)
    samples = array.array('f', [0]) * (math.ceil(duration * RATE) * 2)
    for p in parts:
        phase = 0
        x1 = x2 = y1 = y2 = 0.
        begin = round(p['start'] * RATE)
        length = math.ceil((p['attack'] + p['tau'] * 7) * RATE)
        left = math.cos((p['pan'] + 1) * math.pi / 4)
        right = math.sin((p['pan'] + 1) * math.pi / 4)
        for i in range(min(length, len(samples) // 2 - begin)):
            t = i / RATE
            if p['kind'] == 'noise':
                value = NOISE[p['color']][i % (RATE * 4)]
                f = p['f'] * ((p['sweep'] / p['f']) ** min(t / (p['tau'] * 3), 1) if p['sweep'] else 1)
                omega = TAU * min(f, RATE * .49) / RATE
                c = math.cos(omega)
                q = 10 ** (p['q'] / 20) if p['filter'] != 'bandpass' else p['q']
                alpha = math.sin(omega) / (2 * q)
                b0, b1, b2 = alpha, 0., -alpha
                if p['filter'] == 'lowpass':
                    b0, b1, b2 = (1-c)*.5, 1-c, (1-c)*.5
                elif p['filter'] == 'highpass':
                    b0, b1, b2 = (1+c)*.5, -(1+c), (1+c)*.5
                filtered = (b0*value+b1*x1+b2*x2+2*c*y1-(1-alpha)*y2)/(1+alpha)
                x2, x1, y2, y1 = x1, value, y1, filtered
                value = filtered
            else:
                value = math.sin(phase) if p['kind'] == 'sine' else 2 / math.pi * math.asin(math.sin(phase))
                phase += TAU * p['f'] * (p['f2'] / p['f']) ** min(t / p['glide'], 1) / RATE
            envelope = min(t / p['attack'], 1) * math.exp(-max(0, t-p['attack']) / p['tau'])
            value *= envelope * p['peak']
            samples[(begin+i)*2] += value * left
            samples[(begin+i)*2+1] += value * right
    pcm = array.array('h', [round(max(-1,min(1,x))*32767) for x in samples])
    with wave.open(str(OUT / (name + '.wav')), 'wb') as output:
        output.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
        output.writeframes(pcm.tobytes())

for surface, frequency in SURFACES.items():
    bake('place_'+surface, [tone(520,.2,.045,f2=200,glide=.07), noise(2800,.07,.012,filter='lowpass'), noise(frequency,.06,.02,q=1.2)])
    for variant in range(3):
        parts = [noise(frequency*RNG.uniform(.75,1.25), .15*(1-i*.25), .025, i*RNG.uniform(.018,.03), q=1.3) for i in range(3)]
        parts += [noise(700,.2,.05,color='brown',filter='lowpass'), tone(360,.15,.05,f2=110,glide=.1)]
        if surface in ['grass','leaves']:
            parts += [noise(3500,.08,.07,.03,q=.7,color='pink')]
        if surface == 'glass':
            parts += [tone(RNG.uniform(2800,6000),.03,.04,RNG.uniform(0,.12),pan=RNG.uniform(-.5,.5)) for _ in range(6)]
        bake('break_'+surface+'_'+str(variant), parts)
for index in range(12):
    bake('select_'+str(index), note(degree(5+index,67),.075)+[tone(1800,.02,.01)])
for run in range(10):
    bake('place_note_'+str(run),note(degree(5+run,72),.11,.012))
bake('glass',note(96,.05,.02,True))
bake('lantern',note(88,.05,.05,True)+note(91,.05,.11,True))
bake('click',[tone(1500,.06,.015,f2=900,glide=.02)])
bake('deny',[tone(240,.07,.04,kind='triangle'),tone(190,.07,.05,.09,kind='triangle')])
bake('undo',[tone(900,.07,.06,f2=360,glide=.12),noise(2000,.04,.06,color='pink',sweep=700)])
bake('redo',[tone(360,.07,.06,f2=900,glide=.12)])
bake('shutter',[noise(2500,.12,.02,filter='highpass'),tone(1300,.05,.01),noise(3000,.08,.015,.085,q=1.5),tone(900,.04,.012,.085)])
bake('toast',note(88,.05,bell=True)+note(95,.045,.09,True))
bake('open',note(79,.07)+note(84,.07,.07))
bake('close',note(84,.06)+note(79,.06,.07))
bake('pet',sum([note(n,.09,i*.075,True,RNG.uniform(-.2,.2)) for i,n in enumerate([84,88,91,96])],[])+[tone(600,.06,.06,.02,f2=1100,glide=.09)])
bake('banner',sum([note(n,.08,i*.08,pan=(i-2)*.15) for i,n in enumerate([72,76,79,84,88])],[]))
bake('start',sum([note(n,.07,i*.06,True,(i-2.5)*.12) for i,n in enumerate([72,76,79,83,86,91])],[]))
print('Baked',len(list(OUT.glob('*.wav'))),'source action clips')
