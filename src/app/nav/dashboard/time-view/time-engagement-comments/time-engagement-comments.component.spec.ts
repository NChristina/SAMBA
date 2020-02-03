import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeEngagementCommentsComponent } from './time-engagement-comments.component';

describe('TimeEngagementCommentsComponent', () => {
  let component: TimeEngagementCommentsComponent;
  let fixture: ComponentFixture<TimeEngagementCommentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeEngagementCommentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeEngagementCommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
