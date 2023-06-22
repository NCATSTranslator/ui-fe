describe('run query', () => {
  it('user can input string, receive autocomplete items, then submit query', () => {

    cy.visit('http://localhost:8386/');

    // accept disclaimer
    cy.get('button[aria-label="accept disclaimer"]').click();
    
    // type string
    let queryBar = cy.get('input[placeholder="Enter a Disease"]');
    queryBar.type('diabetes');    
    
    // wait for name resolver
    cy.intercept('POST' , 'https://name-resolution-sri.renci.org/lookup?string=diabetes&offset=0&limit=20').as('nameresolver'); 
    cy.wait('@nameresolver').its('response.statusCode').should('eq', 200);
    // 500ms timeout for node normalizer
    cy.wait(500)
    
    // check list of autocomplete items
    cy.get('[data-testid="autocomplete-list"]').children().should('have.length.greaterThan', 3);
    
    // alter initial string 
    queryBar.clear();    
    queryBar.type('heart disease');   

    // wait for name resolver
    cy.intercept('POST' , 'https://name-resolution-sri.renci.org/lookup?string=heart%20disease&offset=0&limit=20').as('nameresolver');
    cy.wait('@nameresolver').its('response.statusCode').should('eq', 200);
    // 500ms timeout for node normalizer
    cy.wait(500);
    
    // check list of autocomplete items
    cy.get('[data-testid="autocomplete-list"]').children().should('have.length.greaterThan', 3);

    // select an item
    cy.get('[data-testid="autocomplete-list"]').children().first().click();
    // submit 
    cy.get('button[data-testid="query-submit"]').click();

    cy.intercept('POST' , '/api/creative_status').as('status'); 
    cy.wait('@status').its('response.body').should('eq', 200);
  })
})