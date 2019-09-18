import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ChartService } from './nav/dashboard/services/chart.service';
import { SearchService } from './nav/services/search.service';
import { DataService } from './nav/services/data.service';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './/app-routing.module';
import { NavComponent } from './nav/nav.component';
import { MatGridListModule,
        MatCardModule,
        MatMenuModule,
        MatIconModule,
        MatButtonModule,
        MatToolbarModule,
        MatSidenavModule,
        MatListModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatInputModule,
        MatButtonToggleModule,
        MatFormFieldModule } from '@angular/material';
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
        MdcElevationModule,
        MdcSnackbarModule,
        MdcTypographyModule,
        MdcSelectModule
        } from '@angular-mdc/web';
import { TagCloudModule } from 'angular-tag-cloud-module';
import { Ng5SliderModule } from 'ng5-slider';
import { LoadingModalComponent } from './nav/loading-modal/loading-modal.component';
import { LoadingSvgComponent } from './shared/loading-svg/loading-svg.component';
import { AuthGuardService } from './shared/auth-guard.service';

import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './nav/dashboard/dashboard.component';
import { CommentComponent } from './nav/dashboard/comment/comment.component';
import { HardfactsComponent } from './nav/dashboard/hardfacts/hardfacts.component';
import { MainvisComponent } from './nav/dashboard/mainvis/mainvis.component';
import { EngagementCommentsComponent } from './nav/dashboard/overview/engagement-comments/engagement-comments.component';
import { LanguageComponent } from './nav/dashboard/overview/language/language.component';
import { SentimentComponent } from './nav/dashboard/overview/sentiment/sentiment.component';
import { TopicComponent } from './nav/dashboard/overview/topic/topic.component';

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
    TopicComponent,
    LoadingModalComponent,
    LoadingSvgComponent,
    LoginComponent,
    EngagementCommentsComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
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
    MatProgressSpinnerModule,
    MatInputModule,
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
    MdcSnackbarModule,
    MdcTypographyModule,
    MdcSelectModule,
    Ng5SliderModule,
    TagCloudModule,
    HttpClientModule,
    MatButtonToggleModule,
    MatFormFieldModule
  ],
  providers: [SearchService, DataService, ChartService, AuthGuardService],
  bootstrap: [AppComponent]
})
export class AppModule { }
