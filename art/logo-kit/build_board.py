from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
D = ROOT / 'digital'
A = ROOT / 'app'
W, H = 1800, 1600
board = Image.new('RGB', (W,H), '#f7f3e9')
draw = ImageDraw.Draw(board)
font = '/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf'
plain = '/System/Library/Fonts/Supplemental/Arial.ttf'
F = lambda n: ImageFont.truetype(font,n)
P = lambda n: ImageFont.truetype(plain,n)
ink, cream, teal, orange, green = '#082149','#FFF4DA','#23C8CD','#FF932C','#689A38'

def card(x,y,w,h,fill='#ffffff'):
    draw.rounded_rectangle((x,y,x+w,y+h),radius=30,fill=fill,outline='#d8d6d0',width=2)

def label(x,y,text):
    draw.text((x,y),text,font=F(21),fill='#536374')

def fit(path,x,y,w,h):
    im=Image.open(path).convert('RGBA')
    im.thumbnail((w,h),Image.Resampling.LANCZOS)
    board.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2),im)

draw.text((55,38),'Pet Town  /  the little neighborhood',font=F(49),fill=ink)
draw.text((58,102),'Approved playful identity · kitten + dragon · a single curved nameplate',font=P(25),fill='#536374')

card(55,150,750,820,cream)
label(83,175,'PRIMARY  ·  STACKED')
fit(D/'pet-town-stacked-color.png',95,225,670,685)

card(835,150,910,215)
label(861,170,'WEBSITE HEADER')
draw.rounded_rectangle((859,218,1721,338),radius=16,fill='#fff9ed')
fit(D/'pet-town-horizontal-color.png',878,233,426,92)
draw.text((1392,266),'Village   Cast   Download',font=P(19),fill=ink)

card(835,390,430,360, '#e8eef1')
label(861,411,'MAC APP / DOCK')
fit(A/'pet-town-app-icon-512.png',904,463,236,236)
draw.text((964,709),'Pet Town',font=P(18),fill=ink)

card(1290,390,455,360)
label(1317,411,'BROWSER TAB')
draw.rounded_rectangle((1317,482,1718,554),radius=16,fill='#e9edf2')
fit(ROOT/'web/pet-town-32.png',1331,498,39,39)
draw.text((1383,504),'Pet Town',font=P(22),fill=ink)
draw.text((1323,615),'16 / 32 px: use the simplified',font=P(20),fill='#536374')
draw.text((1323,640),'companion icon, not the scene.',font=P(20),fill='#536374')

card(835,779,910,191,'#f0f6f5')
label(861,799,'WIDE LOCKUP  ·  README / SETTINGS')
fit(D/'pet-town-horizontal-color.png',875,833,790,116)

card(55,1000,520,405)
label(83,1022,'GITHUB README')
draw.rounded_rectangle((81,1070,549,1373),radius=12,fill='#f8fafc',outline='#d6dde5')
draw.text((107,1092),'# Pet Town',font=F(29),fill=ink)
fit(D/'pet-town-horizontal-color.png',109,1150,418,139)
draw.text((107,1316),'Your agents, with a little more soul.',font=P(17),fill='#536374')

card(599,1000,520,405,'#e8f4f3')
label(627,1022,'SOCIAL PROFILE')
fit(ROOT/'social/pet-town-avatar-1024.png',724,1079,275,275)

card(1143,1000,602,405,'#102b4d')
draw.text((1171,1022),'ONE-COLOUR STICKER',font=F(21),fill='#d4e4eb')
fit(D/'pet-town-horizontal-white.png',1173,1106,542,205)
draw.text((1175,1339),'A simplified fallback, not the illustrated master.',font=P(18),fill='#d4e4eb')

label(59,1440,'PALETTE')
for n,(name,col) in enumerate((('Ink',ink),('Teal',teal),('Orange',orange),('Sunflower','#FFDE54'),('Meadow',green),('Cream',cream))):
    x=55+n*287
    draw.rounded_rectangle((x,1480,x+62,1542),radius=15,fill=col,outline='#d8d6d0')
    draw.text((x+72,1488),name,font=F(19),fill=ink)
    draw.text((x+72,1515),col.upper(),font=P(17),fill='#536374')

out=ROOT/'presentation-board.png'
board.save(out)
print(out)
