import type { Me, Profile } from '../contract';
import { api } from '../api';
import { getState, setState } from './store';

/** Check the session cookie once at start. Signed-out and offline both just leave the app as a guest. */
export async function checkSession(): Promise<void> {
  try {
    const me = await api.me();
    if (me) adopt(me, false);
  } catch {
    // offline or API down: carry on as a guest with the phone's copy
  } finally {
    setState({ meChecked: true });
  }
}

/** After sign-in or sign-up: take the account's profile (filling gaps from the phone) and offer to move guest chats. */
export function adopt(me: Me, fresh: boolean) {
  const s = getState();
  const local = s.profile;
  const merged: Profile = {
    ...me.profile,
    name: me.profile.name ?? local.name,
    state: me.profile.state ?? local.state,
    district: me.profile.district ?? local.district,
    lat: me.profile.lat ?? local.lat,
    lon: me.profile.lon ?? local.lon,
    crops: me.profile.crops.length ? me.profile.crops : local.crops,
    farmSizeAcres: me.profile.farmSizeAcres ?? local.farmSizeAcres,
    lang: s.lang,
  };
  setState({ me: { ...me, profile: merged }, profile: merged, importOffer: fresh ? s.guest.length : 0 });
  const changed = (Object.keys(merged) as (keyof Profile)[]).filter((k) => JSON.stringify(merged[k]) !== JSON.stringify(me.profile[k]));
  if (changed.length) void api.patchMe(Object.fromEntries(changed.map((k) => [k, merged[k]])) as Partial<Profile>, s.lang).catch(() => undefined);
}

let timer: ReturnType<typeof setTimeout> | undefined;
let queued: Partial<Profile> = {};

/** Change the farm details on this phone, and in the account when signed in (batched). */
export function updateProfile(patch: Partial<Profile>) {
  setState((s) => ({ profile: { ...s.profile, ...patch } }));
  if (!getState().me) return;
  queued = { ...queued, ...patch };
  clearTimeout(timer);
  timer = setTimeout(() => {
    const send = queued;
    queued = {};
    api.patchMe(send, getState().lang).then((me) => setState((s) => (s.me ? { me } : {}))).catch(() => undefined);
  }, 600);
}

export function addCrop(id: string) {
  const crops = getState().profile.crops;
  if (!crops.includes(id)) updateProfile({ crops: [...crops, id].slice(0, 20) });
}

export async function importGuest(): Promise<void> {
  const s = getState();
  const turns = s.guest.slice(-200);
  if (turns.length) await api.importChats(turns, s.lang);
  setState({ guest: [], importOffer: 0 });
}

export async function signOut(): Promise<void> {
  await api.logout(getState().lang).catch(() => undefined);
  setState({ me: null, thread: [], importOffer: 0 });
}
