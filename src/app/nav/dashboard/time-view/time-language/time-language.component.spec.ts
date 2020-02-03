import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeLanguageComponent } from './time-language.component';

describe('TimeLanguageComponent', () => {
  let component: TimeLanguageComponent;
  let fixture: ComponentFixture<TimeLanguageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeLanguageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeLanguageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
