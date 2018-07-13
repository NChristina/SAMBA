import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ChartService } from './nav/dashboard/services/chart.service';
import { SearchService } from './nav/services/search.service';
import { DataService } from './nav/services/data.service';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './/app-routing.module';
import { NavComponent } from './nav/nav.component';
import { MatGridListModule, MatCardModule, MatMenuModule,
  MatIconModule, MatButtonModule, MatToolbarModule, MatSidenavModule,
  MatListModule, MatCheckboxModule } from '@angular/material';
import { LayoutModule } from '@angular/cdk/layout';
import { MdcDrawerModule,
    MdcListModule,
    MdcToolbarModule,
    MdcIconModule,
    MdcCardModule,
    MdcTextFieldModule,
    MdcFormFieldModule,
    MdcCheckboxModule,
    MdcButtonModule,
    MdcChipsModule,
    MdcFabModule,
    MdcElevationModule} from '@angular-mdc/web';
import { DashboardComponent } from './nav/dashboard/dashboard.component';
import { HardfactsComponent } from './nav/dashboard/hardfacts/hardfacts.component';
import { LanguageComponent } from './nav/dashboard/language/language.component';
import { CommentComponent } from './nav/dashboard/comment/comment.component';
import { MainvisComponent } from './nav/dashboard/mainvis/mainvis.component';
import { SentimentComponent } from './nav/dashboard/sentiment/sentiment.component';


@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    DashboardComponent,
    HardfactsComponent,
    LanguageComponent,
    CommentComponent,
    MainvisComponent,
    SentimentComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    LayoutModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatCheckboxModule,
    MdcDrawerModule,
    MdcListModule,
    MdcToolbarModule,
    MdcIconModule,
    MdcCardModule,
    MdcTextFieldModule,
    MdcFormFieldModule,
    MdcCheckboxModule,
    MdcButtonModule,
    MdcChipsModule,
    MdcFabModule,
    MdcElevationModule,
    HttpClientModule
  ],
  providers: [SearchService, DataService, ChartService],
  bootstrap: [AppComponent]
})
export class AppModule { }
