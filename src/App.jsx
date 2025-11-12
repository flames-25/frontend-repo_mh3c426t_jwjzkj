import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Camera, Clock, LogIn, Settings as SettingsIcon } from 'lucide-react'
import Spline from '@splinetool/react-spline'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useSettings(){
  const [data,setData] = useState({ settings:null, monetization:null, loading:true })
  useEffect(()=>{ (async()=>{
    try{ const r= await fetch(`${API}/public/settings`); const j = await r.json(); setData({ ...j, loading:false }) }catch(e){ setData({ settings:null, monetization:null, loading:false }) }
  })() },[])
  return data
}

function NeonBackground({bg, blur, preset}){
  const fallback = (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,107,0.3),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(72,207,203,0.25),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(164,107,242,0.28),transparent_40%)]" />
  )
  return (
    <div className="absolute inset-0 overflow-hidden">
      {bg ? <img src={bg} alt="bg" className="w-full h-full object-cover" style={{ filter:`blur(${blur||10}px)`, opacity:.85 }} /> : fallback}
      <div className="absolute inset-0" style={{background:"linear-gradient(120deg,rgba(0,0,0,.35),rgba(0,0,0,.55))"}} />
    </div>
  )
}

function Layout({children}){
  const {settings} = useSettings()
  return (
    <div className="relative min-h-screen">
      <NeonBackground bg={settings?.background_url} blur={settings?.blur} preset={settings?.background_preset} />
      <header className="relative z-10 max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass grid place-items-center"><Camera className="text-white" size={22}/></div>
          <div>
            <div className="font-bold text-white text-xl">PixFlow 2025</div>
            <div className="text-xs text-white/70 -mt-1">Photos that live for 15 days</div>
          </div>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/admin-login" className="neon-btn px-4 py-2 text-sm flex items-center gap-2"><LogIn size={16}/> Admin</Link>
        </nav>
      </header>
      <main className="relative z-10">{children}</main>
      <footer className="relative z-10 max-w-7xl mx-auto px-4 py-10 text-white/70">© 2025 PixFlow. All rights reserved.</footer>
    </div>
  )
}

function Home(){
  const {settings, monetization} = useSettings()
  const [query,setQuery] = useState('')
  const [events,setEvents] = useState([])
  const [loading,setLoading] = useState(true)
  useEffect(()=>{ (async()=>{
    try{ const r = await fetch(`${API}/public/events`); const j = await r.json(); setEvents(j.events||[]); }catch(e){} finally{ setLoading(false) } })() },[])
  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative grid lg:grid-cols-2 gap-8 items-center">
          <div className="glass p-6 md:p-10">
            <motion.h1 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.6}} className="text-4xl md:text-5xl font-bold">
              Capture the moment. It fades in 15 days.
            </motion.h1>
            <p className="mt-4 text-white/80">Browse events without logging in. Download watermarked photos or buy originals when enabled.</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 glass flex items-center gap-2 px-3 py-2">
                <Search className="text-white/80" size={18}/>
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search events" className="bg-transparent outline-none w-full placeholder-white/60" />
              </div>
              <Link to={"#events"} className="neon-btn px-4 py-2">Explore</Link>
            </div>
          </div>
          <div className="h-[360px] md:h-[460px]">
            <Spline scene="https://prod.spline.design/41MGRk-UDPKO-l6W/scene.splinecode" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {monetization?.ads_enabled && monetization?.ads_placement === 'Homepage' && monetization?.ads_asset_url && (
          <div className="mt-8 glass p-4">
            <img src={monetization.ads_asset_url} className="w-full h-32 object-cover rounded-xl" />
          </div>
        )}

        <div id="events" className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Live Events</h2>
          {loading ? (
            <div className="text-white/70">Loading...</div>
          ) : events.length === 0 ? (
            <div className="glass p-6 text-white/80">No active events yet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.filter(e => !query || e.title?.toLowerCase().includes(query.toLowerCase())).map((e,idx)=> (
                <Link to={`/event/${e.slug}`} key={idx} className="group glass overflow-hidden">
                  <div className="h-44 bg-white/5">
                    {e.cover_url ? <img src={e.cover_url} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-white/40">No Cover</div>}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-sm text-white/70">{e.date || 'Date TBA'}</div>
                    <div className="mt-2 inline-flex items-center gap-2 text-xs bg-white/10 rounded-full px-3 py-1"><Clock size={14}/> {e.days_left} days left</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  )
}

function EventPage(){
  const {settings, monetization} = useSettings()
  const slug = window.location.pathname.split('/').pop()
  const [data,setData] = useState(null)
  const [loading,setLoading] = useState(true)
  useEffect(()=>{ (async()=>{ try{const r= await fetch(`${API}/public/event/${slug}`); const j= await r.json(); setData(j)}catch(e){} finally{setLoading(false)}})() },[slug])
  if(loading) return <Layout><div className="max-w-7xl mx-auto px-4 py-20 text-white/70">Loading...</div></Layout>
  if(!data) return <Layout><div className="max-w-7xl mx-auto px-4 py-20 glass p-6">Event not found or expired.</div></Layout>
  const event = data.event
  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-4">
        <div className="glass p-5 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <div className="text-white/70">{event.date} {event.location? `• ${event.location}`:''}</div>
            </div>
            <Countdown seconds={event.seconds_left}/>
          </div>
        </div>

        {monetization?.ads_enabled && monetization?.ads_placement === 'Event' && monetization?.ads_asset_url && (
          <div className="mt-6 glass p-4">
            <img src={monetization.ads_asset_url} className="w-full h-32 object-cover rounded-xl" />
          </div>
        )}

        <div className="mt-6 columns-2 md:columns-3 lg:columns-4 gap-4 masonry">
          {data.photos.map((p)=> (
            <div key={p.id} className="photo-card glass overflow-hidden">
              <img src={p.public_url} className="w-full h-auto" loading="lazy" />
              <div className="p-3 flex items-center justify-between text-sm">
                {monetization?.payments_enabled ? (
                  <button className="neon-btn px-3 py-1 text-sm">Buy & Download — ${monetization.price_usd || 0}</button>
                ) : (
                  <a href={`${API}/public/download/${p.id}`} target="_blank" className="neon-btn px-3 py-1 text-sm">Download</a>
                )}
              </div>
            </div>
          ))}
        </div>

        {monetization?.ads_enabled && monetization?.ads_placement === 'Sidebar' && monetization?.ads_asset_url && (
          <div className="mt-6 glass p-4">
            <img src={monetization.ads_asset_url} className="w-full h-32 object-cover rounded-xl" />
          </div>
        )}

        <ContactBox />
      </section>
    </Layout>
  )
}

function Countdown({seconds}){
  const [s,setS] = useState(seconds)
  useEffect(()=>{ const t = setInterval(()=> setS(v => Math.max(0,v-1)), 1000); return ()=> clearInterval(t) },[])
  const days = Math.floor(s/86400), hours = Math.floor((s%86400)/3600), mins = Math.floor((s%3600)/60)
  return (
    <div className="countdown-glow glass px-4 py-2 inline-flex items-center gap-2">
      <Clock size={16} /> {days}d {hours}h {mins}m left
    </div>
  )
}

function ContactBox(){
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [message,setMessage] = useState('')
  const [sent,setSent] = useState(false)
  const submit = async (e)=>{
    e.preventDefault()
    const r = await fetch(`${API}/public/contact`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name,email,message}) })
    if(r.ok) setSent(true)
  }
  return (
    <div className="mt-10 glass p-6">
      <h3 className="text-xl font-semibold mb-2">Didn’t find your photo?</h3>
      {sent ? <div className="text-green-300">Thanks! We'll get back to you.</div> : (
        <form onSubmit={submit} className="grid md:grid-cols-3 gap-3">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="bg-white/10 rounded-xl px-3 py-2 outline-none" required/>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" className="bg-white/10 rounded-xl px-3 py-2 outline-none" required/>
          <div className="md:col-span-3 flex items-center gap-3">
            <input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message" className="flex-1 bg-white/10 rounded-xl px-3 py-2 outline-none" required/>
            <button className="neon-btn px-4 py-2">Send</button>
          </div>
        </form>
      )}
    </div>
  )
}

// Admin minimal auth flow (register/login pages)
function AdminGate(){
  const [setup,setSetup] = useState(null)
  useEffect(()=>{ (async()=>{ const r = await fetch(`${API}/admin/setup-required`); const j = await r.json(); setSetup(j.setup) })() },[])
  if(setup===null) return <div className="p-10">Loading...</div>
  return setup ? <AdminRegister/> : <AdminLogin/>
}

function AdminRegister(){
  const nav = useNavigate()
  const [form,setForm] = useState({full_name:'',username:'',email:'',password:'',confirm:''})
  const submit = async (e)=>{ e.preventDefault(); const r = await fetch(`${API}/admin/register`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)}); if(r.ok){ nav('/admin') } }
  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold mb-4">Create Admin</h1>
      <form onSubmit={submit} className="space-y-3">
        {['full_name','username','email','password','confirm'].map(k=> (
          <input key={k} type={k.includes('password')? 'password': (k==='email'? 'email':'text')} placeholder={k.replace('_',' ')} className="w-full bg-white/10 rounded-xl px-4 py-3" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required />
        ))}
        <button className="neon-btn px-4 py-2">Continue</button>
      </form>
    </AuthLayout>
  )
}

function AdminLogin(){
  const nav = useNavigate()
  const [form,setForm] = useState({username:'',password:''})
  const submit = async (e)=>{ e.preventDefault(); const r = await fetch(`${API}/admin/login`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form), credentials:'include'}); if(r.ok){ nav('/admin') } }
  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold mb-4">Admin Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <input placeholder="Username" className="w-full bg-white/10 rounded-xl px-4 py-3" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required />
        <input type="password" placeholder="Password" className="w-full bg-white/10 rounded-xl px-4 py-3" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
        <button className="neon-btn px-4 py-2">Sign in</button>
      </form>
    </AuthLayout>
  )
}

function AuthLayout({children}){
  return (
    <div className="relative min-h-screen grid place-items-center">
      <NeonBackground />
      <div className="relative z-10 glass p-8 w-full max-w-md">{children}</div>
    </div>
  )
}

function AdminDashboard(){
  const [me,setMe] = useState(null)
  const [events,setEvents] = useState([])
  const nav = useNavigate()
  useEffect(()=>{ (async()=>{ const r= await fetch(`${API}/admin/me`,{credentials:'include'}); if(r.ok){ setMe(await r.json()) } else { nav('/admin-login') } })() },[])
  useEffect(()=>{ (async()=>{ const r= await fetch(`${API}/admin/events`,{credentials:'include'}); if(r.ok){ const j= await r.json(); setEvents(j.events) } })() },[])
  if(!me) return <AuthLayout><div>Loading...</div></AuthLayout>
  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-4">
          {[
            {label:'Active Events', value: events.filter(e=>e.status==='Active').length},
            {label:'Photos Uploaded', value: events.reduce((a,b)=>a+(b.photos||0),0)},
            {label:'Total Downloads', value: events.reduce((a,b)=>a+(b.downloads||0),0)},
            {label:'Visitors (30d)', value: '—'},
          ].map((k,idx)=> (
            <div key={idx} className="glass p-5"><div className="text-sm text-white/70">{k.label}</div><div className="text-2xl font-bold mt-1">{k.value}</div></div>
          ))}
        </div>

        <div className="mt-8 glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Events</h3>
            <Link to="/admin/new-event" className="neon-btn px-3 py-2">Create Event</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-white/70">
                <tr><th className="p-2">Name</th><th>Date</th><th>Status</th><th>Days Left</th><th>Downloads</th><th></th></tr>
              </thead>
              <tbody>
                {events.map((e)=> (
                  <tr key={e.id} className="border-t border-white/10">
                    <td className="p-2">{e.title}</td>
                    <td>{e.date||'—'}</td>
                    <td>{e.status}</td>
                    <td>{e.days_left}</td>
                    <td>{e.downloads}</td>
                    <td className="text-right"><Link className="neon-btn px-3 py-1" to={`/admin/event/${e.id}`}>Manage</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  )
}

function NewEvent(){
  const nav = useNavigate()
  const [form,setForm] = useState({title:'',description:'',date:'',location:'',expiry_days:15})
  const submit = async(e)=>{
    e.preventDefault();
    const r = await fetch(`${API}/admin/events`,{method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(form)})
    if(r.ok){ const j= await r.json(); nav(`/admin/event/${j.id}`) }
  }
  return (
    <Layout>
      <section className="max-w-3xl mx-auto px-4">
        <div className="glass p-6">
          <h1 className="text-2xl font-semibold mb-4">Create Event</h1>
          <form onSubmit={submit} className="grid gap-3">
            {['title','description','date','location'].map((k)=> (
              <input key={k} placeholder={k.charAt(0).toUpperCase()+k.slice(1)} className="bg-white/10 rounded-xl px-4 py-3" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required={k==='title'} />
            ))}
            <label className="text-white/80">Expiry days
              <input type="number" min={1} max={90} className="bg-white/10 rounded-xl px-4 py-3 w-full" value={form.expiry_days} onChange={e=>setForm({...form,expiry_days:parseInt(e.target.value)})}/>
            </label>
            <button className="neon-btn px-4 py-2">Create</button>
          </form>
        </div>
      </section>
    </Layout>
  )
}

function ManageEvent(){
  const id = window.location.pathname.split('/').pop()
  const [info,setInfo] = useState(null)
  const [photos,setPhotos] = useState([])
  const [cover,setCover] = useState(null)
  useEffect(()=>{ (async()=>{ const r= await fetch(`${API}/admin/events`,{credentials:'include'}); const j= await r.json(); setInfo((j.events||[]).find(x=>x.id===id)) })() },[id])
  useEffect(()=>{ (async()=>{ const r= await fetch(`${API}/admin/events/${id}/photos`,{credentials:'include'}); if(r.ok){ const j= await r.json(); setPhotos(j.photos) } })() },[id])
  const uploadCover = async ()=>{
    const fd = new FormData(); fd.append('file', cover);
    const r = await fetch(`${API}/admin/events/${id}/cover`, { method:'POST', credentials:'include', body: fd })
    if(r.ok){ const j= await r.json(); setInfo({...info, cover_url: j.cover_url}) }
  }
  const uploadPhotos = async (files)=>{
    const fd = new FormData(); [...files].forEach(f=> fd.append('files', f))
    const r = await fetch(`${API}/admin/events/${id}/photos`, { method:'POST', credentials:'include', body: fd })
    if(r.ok){ const j= await r.json(); setPhotos(p=>[...j.photos.map(x=>({public_url:x.public_url})), ...p]) }
  }
  if(!info) return <Layout><div className="max-w-7xl mx-auto px-4 py-10">Loading...</div></Layout>
  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="glass p-4">
              <h2 className="text-xl font-semibold mb-3">Photos</h2>
              <div className="border border-white/10 rounded-xl p-4 text-center">
                <input type="file" multiple accept="image/*" onChange={e=> uploadPhotos(e.target.files)} className="hidden" id="photos" />
                <label htmlFor="photos" className="neon-btn px-4 py-2 inline-block cursor-pointer">Bulk Upload</label>
              </div>
              <div className="mt-4 columns-2 md:columns-3 gap-3">
                {photos.map((p,idx)=> (
                  <img key={idx} src={p.public_url} className="mb-3 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="glass p-4">
              <h2 className="text-xl font-semibold mb-3">Cover</h2>
              {info.cover_url ? <img src={info.cover_url} className="w-full h-40 object-cover rounded-xl"/>: <div className="w-full h-40 grid place-items-center bg-white/5 rounded-xl">No cover</div>}
              <input type="file" accept="image/*" onChange={e=> setCover(e.target.files[0])} className="mt-3"/>
              <button onClick={uploadCover} className="neon-btn px-4 py-2 mt-3">Upload</button>
            </div>
            <div className="glass p-4">
              <h2 className="text-xl font-semibold mb-3">Visibility</h2>
              <ExtendVisibility id={id} />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

function ExtendVisibility({id}){
  const [days,setDays] = useState(7)
  const extend = async ()=>{
    const r = await fetch(`${API}/admin/events/${id}/extend`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({days}) })
    if(r.ok){ alert('Extended!') }
  }
  return (
    <div className="flex items-center gap-3">
      <input type="number" min={1} max={90} value={days} onChange={e=>setDays(parseInt(e.target.value))} className="bg-white/10 rounded-xl px-3 py-2 w-24" />
      <button onClick={extend} className="neon-btn px-4 py-2">Extend</button>
    </div>
  )
}

function App(){
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/event/:slug" element={<EventPage/>} />
          <Route path="/admin-login" element={<AdminGate/>} />
          <Route path="/admin-register" element={<AdminRegister/>} />
          <Route path="/admin" element={<AdminDashboard/>} />
          <Route path="/admin/new-event" element={<NewEvent/>} />
          <Route path="/admin/event/:id" element={<ManageEvent/>} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}

export default App
