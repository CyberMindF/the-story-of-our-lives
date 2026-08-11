import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StaticContentService } from '../../core/static-content.service';
import { AppShell } from '../../shell/app-shell';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { ContentMessage } from '../../shared/content-message/content-message';
import { Bacheca } from '../bacheca/bacheca';
interface Photo{type:'photo';key:string;caption?:string;devId?:number}interface Text{type:'text';text:string;link?:{href:string;label:string}}interface External{type:'external';href:string;caption?:string}interface Media{type:'audio'|'video';key:string;label?:string;vertical?:boolean;devId?:number}type Block=Photo|Text|External|Media;interface Column{width:number;blocks:Block[]}interface Row{columns:Column[]}interface Day{title?:string;slug:string;rows:Row[]}interface Period{title:string;slug:string;days:Day[]}
@Component({selector:'app-bacheca-preview',standalone:true,imports:[AppShell,RouterLink,AudioPlayer,ContentMessage],styleUrls:['../../../styles/pages/bacheca-preview.css'],templateUrl:'./bacheca-preview.html'})
export class BachecaPreview extends Bacheca implements OnInit{
 private readonly content=inject(StaticContentService);protected readonly layoutPeriods=signal<Period[]>([]);protected readonly devMode=signal(false);
 override async ngOnInit(){await super.ngOnInit();try{this.layoutPeriods.set((await this.content.load<{periods:Period[]}>('/content/bacheca-layout.json')).periods)}catch(e){console.error(e)}}
 protected dayId(p:Period,d:Day){return d.slug==='generale'?p.slug:`${p.slug}-${d.slug}`}
 protected rowPhotos(r:Row){return r.columns.flatMap(c=>c.blocks.filter((b):b is Photo=>b.type==='photo'))}
 protected mediaId(b:Photo|Media,t:'Foto'|'Video'){return `${t} ${b.devId??'?'}`}
}
