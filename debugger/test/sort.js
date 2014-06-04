var Quicksort = (function() {
 
  /**
   * Swaps two values in the heap
   *
   * @param {int} indexA Index of the first item to be swapped
   * @param {int} indexB Index of the second item to be swapped
   */
  function swap(array, indexA, indexB) {
    var temp = array[indexA];
    array[indexA] = array[indexB];
    array[indexB] = temp;
  }
 
  /**
   * Partitions the (sub)array into values less than and greater
   * than the pivot value
   *
   * @param {Array} array The target array
   * @param {int} pivot The index of the pivot
   * @param {int} left The index of the leftmost element
   * @param {int} left The index of the rightmost element
   */
  function partition(array, pivot, left, right) {
 
    var storeIndex = left,
        pivotValue = array[pivot].value;
 
    // put the pivot on the right
    swap(array, pivot, right);
 
    // go through the rest
    for(var v = left; v < right; v++) {
 
      // if the value is less than the pivot's
      // value put it to the left of the pivot
      // point and move the pivot point along one
      if(array[v].value < pivotValue) {
        swap(array, v, storeIndex);
        storeIndex++;
      }
    }
 
    // finally put the pivot in the correct place
    swap(array, right, storeIndex);
 
    return storeIndex;
  }
 
  /**
   * Sorts the (sub-)array
   *
   * @param {Array} array The target array
   * @param {int} left The index of the leftmost element, defaults 0
   * @param {int} left The index of the rightmost element,
   defaults array.length-1
   */
  function sort(array, left, right) {
 
    var pivot = null;
 
    if(typeof left !== 'number') {
      left = 0;
    }
 
    if(typeof right !== 'number') {
      right = array.length - 1;
    }
 
    // effectively set our base
    // case here. When left == right
    // we'll stop
    if(left < right) {
 
      // pick a pivot between left and right
      // and update it once we've partitioned
      // the array to values < than or > than
      // the pivot value
      pivot     = left + Math.ceil((right - left) * 0.5);
      newPivot  = partition(array, pivot, left, right);
 
      // recursively sort to the left and right
      sort(array, left, newPivot - 1);
      sort(array, newPivot + 1, right);
    }
 
  }
 
  return {
    sort: sort
  };
 
})();

var array = [];
for(var i = 0; i < 20; i++) {
  var value = Math.round(Math.random() * 100);
  array.push({ value: value });
}

Quicksort.sort(array);
