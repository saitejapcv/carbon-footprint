import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import app from '../../app.js';

describe('Carbon Calculator Calculations', () => {
  beforeEach(() => {
    // Load the actual index.html file content into JSDOM document
    const htmlPath = path.resolve(__dirname, '../../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    document.documentElement.innerHTML = htmlContent;

    // Reset state defaults
    app.state.activeEcosystem = 'rainforest';
    app.state.pollutionFactor = 0;
    app.init();
  });

  it('should calculate baseline/zero-slider emissions correctly', () => {
    // Set all sliders to 0 for baseline check
    document.getElementById('slider-car').value = '0';
    document.getElementById('slider-flights').value = '0';
    document.getElementById('slider-transit').value = '0';
    document.getElementById('slider-electricity').value = '0';
    document.getElementById('slider-clean-energy').value = '0';
    document.getElementById('slider-local').value = '0';
    document.getElementById('slider-waste').value = '0';

    app.calculateCarbonFootprint();

    const result = document.getElementById('result-co2').textContent;
    expect(result).toBe('7.7');

    const gradeText = document.getElementById('feedback-grade-text').textContent;
    expect(gradeText).toBe('STAGE 1: LUSH & SAFE');

    const descText = document.getElementById('feedback-desc-text').textContent;
    expect(descText).toContain('Food choices are driving your footprint');
  });

  it('should calculate custom values correctly and map to Stage 2', () => {
    document.getElementById('slider-car').value = '200';
    document.getElementById('slider-flights').value = '2';
    document.getElementById('slider-transit').value = '50';
    document.getElementById('slider-electricity').value = '100';
    document.getElementById('slider-clean-energy').value = '50';
    document.getElementById('slider-local').value = '80';
    document.getElementById('slider-waste').value = '10';

    // Click segment control buttons directly
    document.querySelector('#control-heating .calc-segment-btn[data-val="electric"]').click();
    document.querySelector('#control-diet .calc-segment-btn[data-val="vegetarian"]').click();

    const result = document.getElementById('result-co2').textContent;
    expect(result).toBe('20.0');

    const gradeText = document.getElementById('feedback-grade-text').textContent;
    expect(gradeText).toBe('STAGE 2: EARLY DAMAGE');

    const descText = document.getElementById('feedback-desc-text').textContent;
    expect(descText).toContain('transport emissions are your largest impact source');
  });

  it('should calculate Stage 3 emissions and descriptions correctly', () => {
    // Reset all sliders
    document.getElementById('slider-car').value = '0';
    document.getElementById('slider-flights').value = '0';
    document.getElementById('slider-transit').value = '0';
    document.getElementById('slider-clean-energy').value = '0';
    document.getElementById('slider-local').value = '0';
    document.getElementById('slider-waste').value = '0';
    document.getElementById('slider-electricity').value = '80';
    
    // Select heating coal, diet heavy meat
    document.querySelector('#control-heating .calc-segment-btn[data-val="coal"]').click();
    document.querySelector('#control-diet .calc-segment-btn[data-val="heavy-meat"]').click();

    const result = document.getElementById('result-co2').textContent;
    expect(result).toBe('22.0');

    const gradeText = document.getElementById('feedback-grade-text').textContent;
    expect(gradeText).toBe('STAGE 3: TIPPING POINT');
    
    const descText = document.getElementById('feedback-desc-text').textContent;
    expect(descText).toContain('The climate has crossed regional tipping points');
    expect(descText).toContain('Your home energy is the main emissions source');
  });

  it('should calculate Stage 4 emissions and descriptions correctly', () => {
    document.getElementById('slider-car').value = '400';
    document.getElementById('slider-flights').value = '0';
    document.getElementById('slider-transit').value = '0';
    document.getElementById('slider-clean-energy').value = '0';
    document.getElementById('slider-local').value = '0';
    document.getElementById('slider-waste').value = '0';
    document.getElementById('slider-electricity').value = '100';

    document.querySelector('#control-heating .calc-segment-btn[data-val="coal"]').click();
    document.querySelector('#control-diet .calc-segment-btn[data-val="heavy-meat"]').click();

    const result = document.getElementById('result-co2').textContent;
    expect(result).toBe('43.6');

    const gradeText = document.getElementById('feedback-grade-text').textContent;
    expect(gradeText).toBe('STAGE 4: SEVERE DAMAGE');
    expect(document.getElementById('feedback-desc-text').textContent).toContain('wildfire seasons months longer');
  });

  it('should map to Stage 5 under high carbon emissions', () => {
    document.getElementById('slider-car').value = '600';
    document.getElementById('slider-flights').value = '8';
    
    app.calculateCarbonFootprint();

    const resultVal = parseFloat(document.getElementById('result-co2').textContent);
    expect(resultVal).toBeGreaterThan(44.0);

    const gradeText = document.getElementById('feedback-grade-text').textContent;
    expect(gradeText).toBe('STAGE 5: COLLAPSE');
  });

  it('should handle zero or low emissions mapping to factor 0', () => {
    document.getElementById('slider-car').value = '0';
    document.getElementById('slider-flights').value = '0';
    document.getElementById('slider-transit').value = '0';
    document.getElementById('slider-electricity').value = '0';
    document.getElementById('slider-local').value = '100';
    document.getElementById('slider-waste').value = '0';
    
    document.querySelector('#control-heating .calc-segment-btn[data-val="electric"]').click();
    document.querySelector('#control-diet .calc-segment-btn[data-val="vegetarian"]').click();

    expect(app.state.pollutionFactor).toBe(0);
  });

  it('should update theme names correctly for glacier and kelp ecosystems', () => {
    // Helper to set clean inputs
    const setCleanInputs = () => {
      document.getElementById('slider-car').value = '0';
      document.getElementById('slider-flights').value = '0';
      document.getElementById('slider-transit').value = '0';
      document.getElementById('slider-electricity').value = '0';
      document.getElementById('slider-local').value = '100';
      document.getElementById('slider-waste').value = '0';
      document.querySelector('#control-heating .calc-segment-btn[data-val="electric"]').click();
      document.querySelector('#control-diet .calc-segment-btn[data-val="vegetarian"]').click();
    };

    // Helper to set dirty inputs
    const setDirtyInputs = () => {
      document.getElementById('slider-car').value = '600';
      document.getElementById('slider-flights').value = '10';
      app.calculateCarbonFootprint();
    };

    // 1. Glacier ecosystem clean
    setCleanInputs();
    app.state.activeEcosystem = 'glacier';
    app.calculateCarbonFootprint();
    expect(document.getElementById('footer-accent-theme').textContent).toBe('GLACIER ICE');

    // 2. Glacier ecosystem polluted
    setDirtyInputs();
    app.state.activeEcosystem = 'glacier';
    app.calculateCarbonFootprint();
    expect(document.getElementById('footer-accent-theme').textContent).toBe('MELTING CRATER');

    // 3. Kelp ecosystem clean
    setCleanInputs();
    app.state.activeEcosystem = 'kelp';
    app.calculateCarbonFootprint();
    expect(document.getElementById('footer-accent-theme').textContent).toBe('KELP CYAN');

    // 4. Kelp ecosystem polluted
    setDirtyInputs();
    app.state.activeEcosystem = 'kelp';
    app.calculateCarbonFootprint();
    expect(document.getElementById('footer-accent-theme').textContent).toBe('TOXIC ALGAE');
  });

  it('should fallback to 0 when slider elements are missing from the DOM', () => {
    // Save original body HTML
    const originalHTML = document.body.innerHTML;
    
    // Clear body so all sliders are missing, keeping only the result container
    document.body.innerHTML = '<span id="result-co2"></span>';
    
    // Run calculation
    app.calculateCarbonFootprint();
    
    const val = document.getElementById('result-co2').textContent;
    
    // Restore body
    document.body.innerHTML = originalHTML;
    
    // Result should be calculated using all 0 inputs, yielding 7.7
    expect(val).toBe('7.7');
  });
});
