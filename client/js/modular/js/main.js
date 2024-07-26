// import('./module.js').then(async (Module) => {

//     new Module.CustomElement('tag');

//     const element = await Module.Element.parse('./templates/div.html');

//     document.body.append(element);

//     let div = element.querySelector('div');

//     div.addEventListener('mouseover', () => {

//         Module.Element.state = {

//             name: 'in',
//             color: '#606060'

//         }

//     });

//     div.addEventListener('mouseout', () => {

//         Module.Element.state = {

//             name: 'out',
//             color: 'white'

//         }

//     })

//     // let cel = document.createElement('mod-tag');
//     // cel.innerHTML = 'asd';

//     // document.body.append(cel);

// })

window.addEventListener('DOMContentLoaded', () => {

    import('./module.js').then(async (Module) => {

        new Module.CustomElement('tag', async (ctx) => {

            const e = await Module.Element.parse('./templates/test.html');

            // let div = e.querySelector('div');
            // // div.innerHTML = 'content';
            // // div.style.backgroundColor = 'yellow';

            // div.addEventListener('mouseenter', () => {

            //     Module.Element.state = {

            //         name: 'in',
            //         color: '#606060'

            //     }

            // });

            // div.addEventListener('mouseleave', () => {

            //     Module.Element.state = {

            //         name: 'out',
            //         color: 'white'

            //     }

            // })

            return e;

        });

        document.body.append(document.createElement('mod-tag'));

    })

})