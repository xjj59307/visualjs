exports.STATE = {
  ACTIVE: 'active',
  WAITING: 'waiting'
};

exports.JOB = {
  RUN: 'run',
  STEP_IN: 'step in',
  STEP_OVER: 'step over',
  STEP_OUT: 'step out',
  REQUIRE_SOURCE: 'require source',
  NEW_EXPRESSION: 'new expression',
  SET_BREAKPOINT: 'set breakpoint',
  CLEAR_BREAKPOINT: 'clear breakpoint',
  EVALUATE: 'evaluate'
};

// expression evaluating task can't be listed
exports.TASK = {
  RUN: 'run',
  STEP_IN: 'step in',
  STEP_OVER: 'step over',
  STEP_OUT: 'step out',
  REQUIRE_SOURCE: 'require source',
  NEW_EXPRESSION: 'new expression',
  UPDATE_VIS: 'update visual nodes',
  SET_BREAKPOINT: 'set breakpoint',
  CLEAR_BREAKPOINT: 'clear breakpoint',
  EVALUATE: 'evaluate'
};
