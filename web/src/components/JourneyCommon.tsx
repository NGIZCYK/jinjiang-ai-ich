import { useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../lib/i18n'
import { useAppStore } from '../lib/store'
import { cloud } from '../lib/cloud'
export function useCopy(){const {language}=useLanguage();return {language,t:(zh:string,en:string)=>language==='zh'?zh:en}}
export function Notice({children,error=false}:{children:ReactNode;error?:boolean}){return <p className={`journey-notice ${error?'is-error':''}`} role={error?'alert':'status'}>{children}</p>}
export function CloudNotice(){const {t}=useCopy();return !cloud?<Notice>{t('共享服务尚未配置。可以先探索和查看推荐；账号、保存和协同功能需完成部署。','Shared services are not configured. Explore and preview recommendations now; accounts, saving and collaboration require deployment.')}</Notice>:null}
export function useAction(){const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [failed,setFailed]=useState(false);return {busy,message,failed,clear:()=>setMessage(''),run:async(fn:()=>Promise<unknown>,success:string)=>{setBusy(true);setMessage('');setFailed(false);try{await fn();setMessage(success);return true}catch(e){setFailed(true);setMessage(e instanceof Error?e.message:String((e as {message?:string}).message??e));return false}finally{setBusy(false)}}}}
export function RequireRole({ops=false,children}:{ops?:boolean;children:ReactNode}) {
 const {user,ready,authError}=useAppStore();const location=useLocation();const {t}=useCopy()
 if(!ready)return <Notice>{t('正在恢复会话…','Restoring session…')}</Notice>
 if(authError)return <Notice error>{authError} <Link to="/auth">{t('重新登录','Sign in again')}</Link></Notice>
 if(!user)return <Navigate replace to={`/auth?next=${encodeURIComponent(location.pathname+location.search)}`} />
 if(ops&&user.role!=='ops')return <Notice error>{t('此页面仅向酒店运营开放。','This page is available to hotel operations only.')} <Link to="/my">{t('我的行程','My journey')}</Link></Notice>
 return <>{children}</>
}
