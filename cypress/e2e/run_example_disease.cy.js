describe('run example query', () => {
  it('user can select a button and submit an example disease based on a pre-run query', () => {
    cy.get('button[name="Heart Disease"]').click();
  })
})