import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainvisComponent } from './mainvis.component';

describe('MainvisComponent', () => {
  let component: MainvisComponent;
  let fixture: ComponentFixture<MainvisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MainvisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainvisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
