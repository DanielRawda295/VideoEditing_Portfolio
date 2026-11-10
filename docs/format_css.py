"""Whitespace-only formatting for the dependency-free stylesheets."""
from pathlib import Path

def format_css(text):
    lines=[]; token=''; level=0; parens=0; quote=None; escaped=False
    def emit(value):
        if value.strip(): lines.append('  '*level+value.strip())
    for char in text:
        if quote:
            token+=char
            if escaped: escaped=False
            elif char=='\\': escaped=True
            elif char==quote: quote=None
            continue
        if char in ['"',"'"]:
            quote=char; token+=char
        elif char=='(':
            parens+=1; token+=char
        elif char==')':
            parens-=1; token+=char
        elif not parens and char=='{':
            emit(token+' {'); token=''; level+=1
        elif not parens and char=='}':
            emit(token); token=''; level-=1; emit('}')
            if level==0: lines.append('')
        elif not parens and char==';':
            emit(token+';'); token=''
        else:
            token+=char
    emit(token)
    return '\n'.join(lines).strip()+'\n'

for path in (Path(__file__).resolve().parents[1]/'css').glob('*.css'):
    source=path.read_text(encoding='utf-8')
    formatted=format_css(source)
    # Formatting must preserve every non-whitespace character.
    assert ''.join(source.split())==''.join(formatted.split())
    path.write_text(formatted,encoding='utf-8')
    print('Formatted',path.name)
