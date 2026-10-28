"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import SiteHeader from "@/components/site-header";
import { Camera, Check, LoaderCircle, Save, ShieldCheck, UserRound } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Account service is not configured."); setLoading(false); return; }
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) { window.location.href = "/login"; return; }
      const user = data.user;
      setUserId(user.id); setEmail(user.email || "");
      setName(String(user.user_metadata?.full_name || user.user_metadata?.name || ""));
      setDisplayName(String(user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || ""));
      setBio(String(user.user_metadata?.bio || ""));
      setAvatar(String(user.user_metadata?.avatar_url || ""));
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setMessage("");
    if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Profile photo must be under 2 MB."); return; }
    setAvatarFile(file);
    setAvatar(URL.createObjectURL(file));
  }

  async function saveProfile() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;
    setSaving(true); setError(""); setMessage("");
    try {
      let avatarUrl = avatar;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = userId + "/avatar-" + Date.now() + "." + ext;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (uploadError) throw new Error(uploadError.message.includes("Bucket not found") ? "Avatar storage is not set up yet. In Supabase Storage, create a public bucket named avatars, then try again." : "Could not upload profile photo: " + uploadError.message);
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
      const { error: updateError } = await supabase.auth.updateUser({ data: { full_name: name.trim(), display_name: displayName.trim(), bio: bio.trim(), avatar_url: avatarUrl } });
      if (updateError) throw updateError;
      setAvatar(avatarUrl); setAvatarFile(null); setMessage("Your profile has been saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save profile."); }
    finally { setSaving(false); }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) return <main className="profile-shell"><div className="profile-loading"><LoaderCircle className="palm-spin" size={20}/> Loading your profile…</div></main>;

  return <main className="profile-shell">
    <SiteHeader section="Account profile" backHref="/chat" onSignOut={() => void signOut()} />
    <section className="profile-content">
      <div className="profile-eyebrow"><ShieldCheck size={14}/> YOUR PRIVATE SPACE</div><h1>My profile</h1><p className="profile-lead">Manage the details shown on your Vedic AI account. Your changes are saved to your signed-in profile.</p>
      <div className="profile-card">
        <div className="profile-avatar-wrap"><button className="profile-avatar" onClick={() => fileRef.current?.click()} aria-label="Choose profile photo">{avatar ? <img src={avatar} alt="Your profile"/> : <UserRound size={35}/>}<span><Camera size={14}/></span></button><input ref={fileRef} type="file" accept="image/*" onChange={selectAvatar} hidden/><div><strong>{displayName || name || "Your profile"}</strong><small>{email}</small><button className="profile-photo-link" onClick={() => fileRef.current?.click()}>Upload profile photo</button></div></div>
        <div className="profile-form">
          <label>Full name<input value={name} onChange={e => setName(e.target.value)} maxLength={100} placeholder="Your name"/></label>
          <label>Display name<input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={60} placeholder="How should we address you?"/></label>
          <label>About you <span>(optional)</span><textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} rows={4} placeholder="Share your interests or how you prefer to use Vedic AI."/></label>
        </div>
        {error && <p className="profile-error" role="alert">{error}</p>}
        {message && <p className="profile-success"><Check size={15}/>{message}</p>}
        <button className="profile-save" onClick={() => void saveProfile()} disabled={saving}>{saving ? <><LoaderCircle className="palm-spin" size={16}/> Saving…</> : <><Save size={16}/> Save profile</>}</button>
        <p className="profile-privacy"><ShieldCheck size={14}/> Profile details are stored in your authenticated account. Do not add sensitive personal information to your bio.</p>
      </div>
    </section>
    <MobileBottomNav />
  </main>;
}
