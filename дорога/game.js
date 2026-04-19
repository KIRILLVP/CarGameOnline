// дорога


// добавляем
class Road
{
    constructor(image, y)
    {
        this.x = 0;
        this.y = y;
        this.image = new Image();
        this.image.src = image;
    }
 
    Update(road) 
    {
        this.y += speed; //При обновлении изображение смещается вниз
 
        if(this.y > canvas.height) //Если изображение ушло за край холста, то меняем положение
        {
            this.y = road.y - canvas.height + speed;  //Новое положение указывается с учётом второго фона
        }
    }
}





const canvas = document.getElementById("canvas"); //Получение холста из DOM
const ctx = canvas.getContext("2d"); 
 
const scale = 0.1; //Масштаб машин
const speed = 5; //скорость
 
Resize(); // При загрузке страницы задаётся размер холста
 
window.addEventListener("resize", Resize); //При изменении размеров окна будут меняться размеры холста
 
window.addEventListener("keydown", function (e) { KeyDown(e); }); //Получение нажатий с клавиатуры
 
let objects = []; //Массив игровых объектов

// добавляем
let roads = [
new Road("images/road.jpg", 0),
new Road("images/road.jpg", canvas.height)
]; 
 









let player = null; //Объект, которым управляет игрок
 
function Start()
{
    timer = setInterval(Update, 1000 / 60); //Состояние игры будет обновляться 60 раз в секунду — при такой частоте обновление происходящего будет казаться очень плавным
}

function Stop()
{
    clearInterval(timer); //Остановка обновления
}
 
function Update() 
{
    // добавляем
    roads[0].Update(roads[1]);
    roads[1].Update(roads[0]);
 
    Draw();
}
 
function Draw() //Работа с графикой
{
    ctx.clearRect(0, 0, canvas.width, canvas.height); //Очистка холста от предыдущего кадра
	
	// добавляем
	for(var i = 0; i < roads.length; i++)
    {
        ctx.drawImage
        (
            roads[i].image, //Изображение для отрисовки
            0, //Начальное положение по оси X на изображении
            0, //Начальное положение по оси Y на изображении
            roads[i].image.width, //Ширина изображения
            roads[i].image.height, //Высота изображения
            roads[i].x, //Положение по оси X на холсте
            roads[i].y, //Положение по оси Y на холсте
            canvas.width, //Ширина изображения на холсте
            canvas.height //высота
        );
    }
	
}

function KeyDown(e)
{
    switch(e.keyCode)
    {
        case 37: //Влево
            break;
 
        case 39: //Вправо
            break;
 
        case 38: //Вверх
            break;
 
        case 40: //Вниз
            break;
 
        case 27: //Esc
            break;
    }
}

function Resize()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}


Start();












