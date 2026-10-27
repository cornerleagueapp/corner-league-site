import { useState } from "react";
export default function ProfileListAvatar({src,name}:{src?:string|null;name:string}) {
 const [failed,setFailed]=useState(false);
 return <span className="profile-list-avatar" aria-hidden="true">{src&&!failed
   ? <img src={src} alt="" loading="lazy" onError={()=>setFailed(true)}/>
   : name.trim().slice(0,2).toUpperCase() || "CL"}</span>;
}
