describe('run example query', () => {
  it('user can select a button and submit an example disease based on a pre-run query', () => {

    cy.visit('http://localhost:8386/');

    // accept disclaimer
    cy.get('button[aria-label="accept disclaimer"]').click();

    // click the drug disease query button
    cy.get('button[data-testid="drug-disease-selector"]').click();

    // click the Type 2 Diabetes Mellitus button
    cy.get('button[data-testid="Type 2 Diabetes Mellitus"]').click();

    // wait for /creative_result to return success
    cy.intercept(  {
      method: 'GET',
      url: "/demo/api/v1/pub/query/*/result", 
    }).as('results'); 
    cy.wait('@results', {timeout: 60000}).its('response.body.status')
      .should('eq', 'success');

    // click share button
    cy.get('button[data-testid="share-button"]').click();
  })
})