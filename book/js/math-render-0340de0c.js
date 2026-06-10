// Pre-configure MathJax to hide loading/processing messages and setup delimiters
window.MathJax = window.MathJax || {};
window.MathJax.messageStyle = "none";
window.MathJax.showProcessingMessages = false;
window.MathJax.tex2jax = window.MathJax.tex2jax || {};
window.MathJax.tex2jax.inlineMath = window.MathJax.tex2jax.inlineMath || [['$', '$'], ['\\(', '\\)']];
window.MathJax.tex2jax.processEscapes = true;

let mathjaxConfigured = false;

function ensureMathJaxConfigured() {
    if (mathjaxConfigured) return;
    if (window.MathJax && window.MathJax.Hub) {
        window.MathJax.Hub.Config({
            messageStyle: "none",
            showProcessingMessages: false,
            tex2jax: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                processEscapes: true
            }
        });
        mathjaxConfigured = true;
    }
}

function typesetElement(element) {
    if (!window.MathJax) return;
    if (window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([element]).catch(err => console.warn(err));
    } else if (window.MathJax.typeset) {
        window.MathJax.typeset([element]);
    } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
        ensureMathJaxConfigured();
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, element]);
    }
}
