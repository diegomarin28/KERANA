import { useRef } from "react";
import emailjs from "@emailjs/browser";

export default function Contact() {
    const form = useRef();

    const sendEmail = (e) => {
        e.preventDefault();

        emailjs
            .sendForm(
                "service_dan74a5",      // ✅ tu Service ID
                "template_ueime5o",     // ✅ tu Template ID
                form.current,
                "DMO310micvFWXx-j4"     // ✅ tu Public Key
            )
            .then(
                () => {
                    alert("✅ Tu mensaje fue enviado con éxito!");
                    form.current.reset();
                },
                () => {
                    alert("❌ Ocurrió un error al enviar el mensaje.");
                }
            );
    };

    return (
        <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
            <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Contacto</h1>
            <form ref={form} onSubmit={sendEmail} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <label>Nombre</label>
                <input type="text" name="name" required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} />

                <label>Email</label>
                <input type="email" name="email" required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} />

                <label>Mensaje</label>
                <textarea name="message" rows="5" required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} />

                <button type="submit" style={{ padding: "12px", border: "none", borderRadius: "8px", background: "#2563eb", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
                    Enviar
                </button>
            </form>
        </div>
    );
}
