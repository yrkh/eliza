
// math_utils.js

// Calculates factorial of a number
function i_factorial(
    pNum
) {
    let lResult = 1;

    for (
        let lIndex = 2;
        lIndex <= pNum;
        lIndex++
    ) {
        lResult *= lIndex;
    }

    return lResult;
}

// Calculates sine using Taylor series
function x_sineTaylor(
    pDegrees
) {
    let lRadians = pDegrees * Math.PI / 180;
    let lResult = 0;
    let lSign = 1;

    for (
        let lIndex = 1;
        lIndex <= 11;
        lIndex += 2
    ) {
        let lTerm = Math.pow(
            lRadians,
            lIndex
        ) / i_factorial(lIndex);

        lResult += lSign * lTerm;
        lSign *= -1;
    }

    return lResult;
}

// Calculates average of numbers
function x_average(
    pValues
) {
    let lSum = 0;

    for (
        let lIndex = 0;
        lIndex < pValues.length;
        lIndex++
    ) {
        lSum += pValues[lIndex];
    }

    return lSum / pValues.length;
}

// Calculates harmonic mean
function x_harmonicMean(
    pValues
) {
    let lReciprocalSum = 0;

    for (
        let lIndex = 0;
        lIndex < pValues.length;
        lIndex++
    ) {
        lReciprocalSum += 1 / pValues[lIndex];
    }

    return pValues.length / lReciprocalSum;
}

// Calculates geometric mean
function x_geometricMean(
    pValues
) {
    let lProduct = 1;

    for (
        let lIndex = 0;
        lIndex < pValues.length;
        lIndex++
    ) {
        lProduct *= pValues[lIndex];
    }

    return Math.pow(
        lProduct,
        1 / pValues.length
    );
}

// Calculates contra harmonic mean
function x_contraHarmonicMean(
    pValues
) {
    let lNumerator = 0;
    let lDenominator = 0;

    for (
        let lIndex = 0;
        lIndex < pValues.length;
        lIndex++
    ) {
        lNumerator += Math.pow(
            pValues[lIndex],
            2
        );

        lDenominator += pValues[lIndex];
    }

    return lNumerator / lDenominator;
}

// Calculates variance
function x_variance(
    pValues
) {
    let lMean = x_average(pValues);
    let lSumSqDiff = 0;

    for (
        let lIndex = 0;
        lIndex < pValues.length;
        lIndex++
    ) {
        let lDiff = pValues[lIndex] - lMean;
        lSumSqDiff += lDiff * lDiff;
    }

    return lSumSqDiff / pValues.length;
}

// Calculates standard deviation
function x_standardDeviation(
    pValues
) {
    let lVar = x_variance(pValues);
    return Math.sqrt(lVar);
}

// Picks a random item from array
function x_randomChoice(
    pValues
) {
    let lIndex = Math.floor(
        Math.random() * pValues.length
    );

    return pValues[lIndex];
}

module.exports = {
    x_sineTaylor,
    x_average,
    x_harmonicMean,
    x_geometricMean,
    x_contraHarmonicMean,
    x_variance,
    x_standardDeviation,
    x_randomChoice
};
