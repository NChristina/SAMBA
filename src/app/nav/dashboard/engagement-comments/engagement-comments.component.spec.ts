import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EngagementCommentsComponent } from './engagement-comments.component';

describe('EngagementCommentsComponent', () => {
  let component: EngagementCommentsComponent;
  let fixture: ComponentFixture<EngagementCommentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EngagementCommentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EngagementCommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
