export type Lang = 'en' | 'hi' | 'pa'
export interface Profile { name: string | null; lang: Lang; state: string | null; district: string | null; lat: number | null; lon: number | null; crops: string[]; farmSizeAcres: number | null }
export interface Me { user: { id: string; login: string; createdAt: string }; profile: Profile }
export interface Source { id: string; kind: 'scheme' | 'note'; title: string }
export interface ChatReply { text: string; lang: Lang; sources: Source[]; provider: 'groq' | 'gemini' | 'openrouter' | 'workers-ai' | 'guard'; turnId: string | null }
export interface ChatTurn { id: string; at: string; lang: Lang; question: string; answer: string; sources: Source[] }
export interface Scheme { id: string; category: string; name: string; summary: string; eligibility: string; howToApply: string; link: string | null }
export interface ApiError { error: string; code: string; retryAfter?: number; fallback?: 'device' }
