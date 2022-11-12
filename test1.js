async function x(){
    const array = [1, 2, 3]
    let a = 0
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        a += element
        console.log(a)
    }

    console.log(a)

}

await x()