export function html2text(s, r = ' ') {
    return s.replace(/<[^>]+>/g, r);
}
