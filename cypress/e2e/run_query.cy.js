describe('run query', () => {
  it('user can input string, receive autocomplete items, then submit query', () => {

    cy.visit('http://localhost:8386/');

    // accept disclaimer
    cy.get('button[aria-label="accept disclaimer"]').click();

    cy.get('a:contains("Log In")').click();

  })
})