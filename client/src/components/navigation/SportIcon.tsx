// Small, scalable sport silhouettes; currentColor follows light/dark and selection.
const paths: Record<string,string>={
'all':'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
'jet-ski':'M3 16h15l3-4h-7l-4-3-3 4 5 1 M13 4a2 2 0 1 0 0 .1 M2 20q3-2 6 0t6 0t6 0',
'motocross':'M8 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M22 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M5 17l5-8 5 8H5 M15 7l4 10 M9 6h4 M12 3h1',
'boat-racing':'M2 15h20l-5 5H7z M7 15l3-7h6l3 7 M10 8V5h6 M2 23q3-2 6 0t6 0t6 0',
'basketball':'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M2 12h20 M12 2v20 M5 5q12 7 0 14 M19 5q-12 7 0 14',
'baseball':'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M6 4q7 8 0 16 M18 4q-7 8 0 16 M7 7l3 1 M7 16l3-1 M14 8l3-1 M14 15l3 1',
'american-football':'M3 21C0 8 8 0 21 3c3 13-5 21-18 18z M7 17L17 7 M9 11l4 4 M11 9l4 4',
'golf':'M7 21V3l12 5-12 5 M4 21h8 M18 20a2 2 0 1 0 0 .1',
'marathon':'M3 10l5-4 3 6 6 2 5 4v3H2v-5z M9 11l-3 2 M11 14l-3 2',
'soccer':'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 7l5 4-2 6H9l-2-6z M12 2v5 M2 10l5 1 M22 10l-5 1 M6 21l3-4 M18 21l-3-4',
'hockey':'M19 2L10 19H3v3h9L22 3 M17 20h5v2h-5z',
'onewheel-racing':'M8 17a4 4 0 1 1 8 0 4 4 0 0 1-8 0 M2 17h6 M16 17h6 M10 4l4 4-4 5 6 3',
'rc-racing':'M3 12l3-5h12l3 5v7H3z M3 12h18 M6 19v3 M18 19v3 M12 7V2 M6 15h2 M16 15h2',
};
export function SportIcon({sport}:{sport:string}){return <svg className="cl-sport-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[sport]||paths.marathon}/></svg>;}
