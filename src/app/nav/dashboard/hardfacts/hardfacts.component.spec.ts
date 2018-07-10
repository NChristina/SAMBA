import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HardfactsComponent } from './hardfacts.component';

describe('HardfactsComponent', () => {
  let component: HardfactsComponent;
  let fixture: ComponentFixture<HardfactsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HardfactsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HardfactsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
