(function () {
  const toNumber = (value) => {
    if (value === '' || value === null || value === undefined) {
      return 0;
    }
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  };

  const clampMin = (value, minValue) => Math.max(minValue, value);

  const formatYen = (value) =>
    Math.round(value || 0).toLocaleString('ja-JP');

  const formatNumber = (value, fraction = 1) =>
    Number(value || 0).toLocaleString('ja-JP', {
      maximumFractionDigits: fraction,
    });

  const compute = (raw) => {
    const distance = clampMin(toNumber(raw.distance), 0);
    const fuelEfficiency = clampMin(toNumber(raw.fuelEfficiency), 0);
    const gasPrice = clampMin(toNumber(raw.gasPrice), 0);
    const highway = clampMin(toNumber(raw.highway), 0);
    const meals = clampMin(toNumber(raw.meals), 0);
    const lodging = clampMin(toNumber(raw.lodging), 0);
    const sightseeing = clampMin(toNumber(raw.sightseeing), 0);
    const other = clampMin(toNumber(raw.other), 0);
    const peopleInput = clampMin(toNumber(raw.people), 0);
    const people = peopleInput > 0 ? peopleInput : 1;

    const fuelLiters = fuelEfficiency > 0 ? distance / fuelEfficiency : 0;
    const fuelCost = fuelLiters * gasPrice;

    const total =
      fuelCost + highway + meals + lodging + sightseeing + other;
    const perPerson = people > 0 ? total / people : 0;

    const sensitivity = {
      distancePlus10:
        fuelEfficiency > 0 ? (10 / fuelEfficiency) * gasPrice : null,
      fuelEfficiencyMinus1:
        fuelEfficiency > 1
          ? (distance / (fuelEfficiency - 1)) * gasPrice - fuelCost
          : null,
      pricePlus10: fuelEfficiency > 0 ? fuelLiters * 10 : null,
    };

    return {
      inputs: {
        distance,
        fuelEfficiency,
        gasPrice,
        highway,
        meals,
        lodging,
        sightseeing,
        other,
        people,
      },
      fuelLiters,
      fuelCost,
      total,
      perPerson,
      sensitivity,
    };
  };

  window.TouringCostCalc = {
    compute,
    formatYen,
    formatNumber,
  };
})();
