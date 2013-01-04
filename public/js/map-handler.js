function setUpEvents() {
  d3.selectAll('path.str0').on('mouseover', selectRegion);
  d3.selectAll('path.str0').on('mouseout', hidePopUp);
};

function hidePopUp() {
  $("#state-tooltip").hide();
}

function selectRegion() {
  _classOnlyThisAs(this.id, 'hover');
  displayPopUp();
};

function displayPopUp() {
  $("#state-tooltip").show();
}

function _classOnlyThisAs(id, className) {
  d3.selectAll('.'+className).classed(className, false);
  d3.selectAll('#'+id).classed(className, true);
};

$(document).ready(function () {
    setUpEvents();
});

