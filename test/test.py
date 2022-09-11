import binascii
from PIL import Image, ImageSequence
orz = Image.open('0.png')
frames = []

# for fr in ImageSequence.Iterator(orz):
#     frames.append(fr)
# frames[0].save('0.png', save_all=True, append_images=frames[1:])

size = 16

def work_rect(text):    
    res = str(binascii.b2a_hex(text.encode('gb2312')), encoding='utf-8')
    
    #前两位对应汉字的第一个字节：区码，每一区记录94个字符
    area = eval('0x' + res[:2]) - 0xA0

    #后两位对应汉字的第二个字节：位码，是汉字在其区的位置
    index = eval('0x' + res[2:]) - 0xA0

    #汉字在HZK16中的绝对偏移位置，最后乘32是因为字库中的每个汉字字模都需要32字节
    offset = (94 * (area-1) + (index-1)) * size * size // 8

    font_rect = None

    #读取HZK16汉字库文件
    with open("HZK" + str(size), "rb") as f:
        f.seek(offset)
        font_rect = f.read(size * size // 8)

    rs = []
    i = 0
    
    for x in range(size):
        nc = []
        for j in range(size // 8):
            p = font_rect[i]
            i += 1
            for k in range(8):
                nc.append(p >> (7 - k) & 1)
        rs.append(nc)
    
    return rs

text = "您太强了"
# text = "您"

bg = Image.new('RGBA', (28*size*len(text), 28*size), color=(255,255,255,0))
orz = Image.open('0.png')

rc = []
for i in text:
    rc.append(work_rect(i))

frames = []

for fr in ImageSequence.Iterator(orz):
    p = bg.copy();
    i = 0
    for s in rc:
        for x in range(size):
            for y in range(size):
                if s[x][y] == 1:
                    tx, ty = x * 28, y * 28
                    ty += 28 * size * i
                    p.paste(fr, (ty, tx, ty + 28, tx + 28), fr)
        i += 1
    frames.append(p)
frames[0].save('output.png', save_all=True, append_images=frames[1:])
