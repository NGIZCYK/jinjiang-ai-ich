import { useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../lib/i18n'
import { useAppStore } from '../lib/store'
import { cloud } from '../lib/cloud'
import { actionError } from '../lib/actionErrors'
import { rememberContinuation } from '../lib/journeyFlow'
export function useCopy(){const {language}=useLanguage();return {language,t:(zh:string,en:string)=>language==='zh'?zh:en}}
export function Notice({children,error=false}:{children:ReactNode;error?:boolean}){return <div className={`journey-notice ${error?'is-error':''}`} role={error?'alert':'status'}>{children}</div>}
export function CloudNotice(){const {t}=useCopy();return !cloud?<Notice>{t('共享服务尚未配置。可以先探索和查看推荐；账号、保存和协同功能需完成部署。','Shared services are not configured. Explore and preview recommendations now; accounts, saving and collaboration require deployment.')}</Notice>:null}
export function useAction(){const {language}=useLanguage();const lock=useRef(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [failed,setFailed]=useState(false);return {busy,message,failed,clear:()=>{setMessage('');setFailed(false)},run:async(fn:()=>Promise<unknown>,success:string)=>{if(lock.current)return false;lock.current=true;setBusy(true);setMessage('');setFailed(false);try{await fn();setMessage(success);return true}catch(e){setFailed(true);setMessage(actionError(e,language));return false}finally{lock.current=false;setBusy(false)}}}}
export function RequireRole({ops=false,children}:{ops?:boolean;children:ReactNode}) {
 const {user,ready,authError}=useAppStore();const location=useLocation();const {t}=useCopy()
 if(!ready)return <Notice>{t('正在恢复会话…','Restoring session…')}</Notice>
 if(authError)return <Notice error>{authError} <Link to="/auth">{t('重新登录','Sign in again')}</Link></Notice>
 if(!user){rememberContinuation(location.pathname+location.search+location.hash);return <Navigate replace to={`/auth?next=${encodeURIComponent(location.pathname+location.search+location.hash)}`} />}
 if(ops&&user.role!=='ops')return <Notice error>{t('此页面仅向酒店运营开放。','This page is available to hotel operations only.')} <Link to="/my">{t('我的行程','My journey')}</Link></Notice>
 return <>{children}</>
}
