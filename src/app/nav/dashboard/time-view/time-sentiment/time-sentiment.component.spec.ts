import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSentimentComponent } from './time-sentiment.component';

describe('TimeSentimentComponent', () => {
  let component: TimeSentimentComponent;
  let fixture: ComponentFixture<TimeSentimentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeSentimentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeSentimentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
