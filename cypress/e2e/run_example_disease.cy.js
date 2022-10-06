describe('run example query', () => {
  it('user can select a button and submit an example disease based on a pre-run query', () => {

    cy.visit('http://localhost:8386/');

    // accept disclaimer
    cy.get('button[aria-label="accept disclaimer"]').click();

    // click the heart disease button
    cy.get('button[data-testid="heart-disease"]').click();

    // wait for /creative_result to return success
    cy.intercept('POST' , '/creative_result').as('results'); 
    cy.wait('@results', {timeout: 20000}).its('response.body.status').should('eq', 'success');
  })
})