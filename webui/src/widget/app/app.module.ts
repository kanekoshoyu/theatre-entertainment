import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { HttpModule } from "@angular/http";
import { AppComponent } from './embed-widget.component';
import { Ng2PaginationModule } from 'ng2-pagination';
import { MomentModule } from 'angular2-moment';

import { ProgressComponent } from "./components/modules/ProgressBar.component";
import { CardComponent } from "./components/modules/Card.component";
import { AddressComponent } from "./components/modules/Address.component";
import { PhoneComponent } from "./components/modules/Phone.component";
import { CommentComponent } from "./components/comment/Comment.component";
import { LoginComponent } from "./components/modules/Login.component";
import { RegisterComponent } from "./components/modules/Register.component";
import { ProfileComponent } from "./components/modules/Profile.component";

import { CampaignService } from "./service/Campaign.service";
import { CookieService } from "./service/Cookie.service";
import { StripeService } from "./service/Stripe.service";
import { UserService } from "./service/User.service";
import { UtilService } from "./service/Util.service";
import { SettingsService } from "./service/Settings.service";
import { TranslationService } from './service/Translation.service';

import { CardTypeDirective } from "./directives/CardType.directive";
import { SemanticDirective } from "./directives/semantic.directive";
import { ThemeColorDirective } from "./directives/ThemeColor.directive";
import { FontColorDirective } from "./directives/FontColor.directive";
import { VideoEmbedDirective } from "./directives/VideoEmbed.directive";
import { FileSelectDirective } from 'ng2-file-upload/ng2-file-upload';

import { StreamMessagePipe } from "./Pipe/StreamMessage.pipe";
import { CurrencySymbolNumberPipe } from "./Pipe/CurrencySymbolNumber.pipe";

import "zone.js/dist/zone";
import "rxjs/Rx";
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    CommonModule,
    HttpModule,
    Ng2PaginationModule,
    MomentModule
  ],
  declarations: [
    AppComponent,
    CardTypeDirective,
    SemanticDirective,
    ThemeColorDirective,
    FontColorDirective,
    VideoEmbedDirective,
    FileSelectDirective,
    ProgressComponent,
    CardComponent,
    AddressComponent,
    PhoneComponent,
    CommentComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    StreamMessagePipe,
    CurrencySymbolNumberPipe
  ],
  bootstrap: [
    AppComponent
  ],
  providers: [
    UserService,
    CampaignService,
    StripeService,
    CookieService,
    UtilService,
    SettingsService,
    TranslationService
  ]
})

export class AppModule { }