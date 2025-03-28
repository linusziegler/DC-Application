let pathLength, rect, cx, cy;
const ellipse = document.querySelector('.ellipse');
const point = document.getElementById('point');
const ellipsePath = document.getElementById('ellipsePath');
const mainBody = document.querySelector('.main-body');
const chapters = document.querySelectorAll('.chapter-w');
const tooltip = document.querySelector('#tooltip');
const ellipseWrapper = document.querySelector('.ellipse-w');
let scrollTimeout;
let chapterPositions = [];
let scrollMapping = [];

function calculateChapterPositions() {
    chapterPositions = Array.from(chapters).map(chapter => ({
        chapter,
        top: chapter.offsetTop,
        height: chapter.offsetHeight
    }));
}

function getEllipseProperties() {
    pathLength = ellipsePath.getTotalLength();
    cx = window.innerWidth / 2;
    cy = window.innerHeight / 2;
    rx = parseFloat(ellipsePath.getAttribute('rx'));
    ry = parseFloat(ellipsePath.getAttribute('ry'));
}

function preCalculateScrollMapping() {
    const maxScroll = mainBody.scrollHeight - mainBody.clientHeight;
    scrollMapping = Array.from({ length: maxScroll + 1}, (_, scrollOffset) => {
        const scrollRatio = scrollOffset / (maxScroll - 32);
        const arcLength = (scrollRatio * pathLength + (3 * pathLength) / 4) % pathLength;
        const pointAtLength = ellipsePath.getPointAtLength(arcLength);

        const angle = Math.atan2(pointAtLength.y - cy, pointAtLength.x - cx);

        // Position the tooltip outside the ellipse
        const tooltipDistance = Math.max(rx, ry); // Distance from the center
        const tooltipX = pointAtLength.x + tooltipDistance * Math.cos(angle);
        const tooltipY = pointAtLength.y + tooltipDistance * Math.sin(angle);

        // Adjust the transform property to make sure the tooltip is always outside the ellipse
        const rotatedX = Math.cos(angle) * 60;
        const rotatedY = Math.sin(angle) * 70;

        return {
            pointX: pointAtLength.x,
            pointY: pointAtLength.y,
            tooltipX,
            tooltipY,
            rotatedX,
            rotatedY
        };
    });
}

function getCurrentChapter(scrollOffset) {
    let currentChapter = null;
    const windowHeight = window.innerHeight;
    chapterPositions.forEach(({ chapter, top, height }) => {
        if (scrollOffset + windowHeight / 2 >= top && scrollOffset < top + height) {
            currentChapter = chapter;
        }
    });
    return currentChapter;
}

function movePointOnPath() {
    const maxScroll = mainBody.scrollHeight - mainBody.clientHeight;
    // make sure scroll offset stays within bounds
    const scrollOffset = Math.max(0, Math.min(mainBody.scrollTop, maxScroll));
    const { pointX, pointY, tooltipX, tooltipY, rotatedX, rotatedY } = scrollMapping[scrollOffset];

    point.setAttribute('cx', pointX);
    point.setAttribute('cy', pointY);

    tooltip.style.left = `${tooltipX}px`;
    tooltip.style.top = `${tooltipY}px`;
    tooltip.style.transform = `translate(${rotatedX}%, ${rotatedY}%)`;

    // Update tooltip text content based on the current chapter
    const currentChapter = getCurrentChapter(scrollOffset);
    if (currentChapter) {
        tooltip.textContent = currentChapter.id.replace(/-/g, ' ');
    }
}

function handleScroll() {
    ellipseWrapper.style.opacity = '1';
    mainBody.classList.add("hidden");
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        ellipseWrapper.style.opacity = '0';
        mainBody.classList.remove("hidden");
    }, 25);
    movePointOnPath();

    // Seamless scroll-back-to-top logic
    const firstChapter = chapterPositions[0]; // First chapter position
    const duplicateChapter = chapterPositions[chapterPositions.length - 1]; // Last chapter position (duplicate)

    const scrollPosition = mainBody.scrollTop;

    // Check if the user has scrolled to the duplicate chapter
    if (scrollPosition >= duplicateChapter.top) {
        // Seamlessly scroll back to the top
        mainBody.scrollTo({
            top: firstChapter.top,
            behavior: 'auto', // Instant scroll to avoid visible jump
        });
    }
}

function addScrollLinkEventListeners() {
    const scrollLinks = document.querySelectorAll('.scroll-link');
    scrollLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    calculateChapterPositions();
    getEllipseProperties();
    addScrollLinkEventListeners();
    preCalculateScrollMapping();
});
window.addEventListener('resize', () => {
    calculateChapterPositions();
    getEllipseProperties();
    preCalculateScrollMapping();
});
mainBody.addEventListener('scroll', handleScroll);