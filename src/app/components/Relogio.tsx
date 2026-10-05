"use client";
import { useEffect, useState } from "react";

export default function Relogio() {
    const [agora, setAgora] = useState(new Date());

    useEffect(() => {
        const intervalo = setInterval(() => {
            setAgora(new Date());
        }, 1000);

        return () => clearInterval(intervalo);
    }, []);

    const hora = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const data = agora.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    return (
        <p className="whitespace-nowrap mt-0 text-sm text-black">
            Atualizado em{" "}
            <strong>
                {hora} {data}
            </strong>
        </p>
    );
}