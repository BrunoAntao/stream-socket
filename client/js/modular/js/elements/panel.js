import('../module.js').then(async (Module) => {

    new Module.CustomElement('panel', async (ctx) => {

        return await Module.Element.parse('./templates/div.html');

    });

})