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
    return new Promise((resolve) => {
        if (!window.MathJax) {
            resolve();
            return;
        }
        if (window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([element])
                .then(resolve)
                .catch(err => {
                    console.warn(err);
                    resolve();
                });
        } else if (window.MathJax.typeset) {
            try {
                window.MathJax.typeset([element]);
            } catch (err) {
                console.warn(err);
            }
            resolve();
        } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
            ensureMathJaxConfigured();
            window.MathJax.Hub.Queue(
                ["Typeset", window.MathJax.Hub, element],
                function() {
                    resolve();
                }
            );
        } else {
            resolve();
        }
    });
}
