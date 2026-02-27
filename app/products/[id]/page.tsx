import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

type Params = {
  params: { id: string }
}

export default async function ProductDetail({ params }: Params) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const id = Number(params.id)
  if (Number.isNaN(id)) {
    return <div className="container">Không tìm thấy sản phẩm (id không hợp lệ)</div>
  }

  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id, name, description, detail, img, price, origin, contact_address")
    .eq("id", id)
    .single()

  if (prodErr || !product) {
    console.error('product fetch error', prodErr)
    return (
      <div className="container">
        <div>Không tìm thấy sản phẩm</div>
        {prodErr && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{String(prodErr.message || prodErr)}</pre>}
      </div>
    )
  }

  const { data: imagesData } = await supabase
    .from("images")
    .select("image_url")
    .eq("product_id", id)

  return (
    <div className="container">
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <h1>{product.name}</h1>
          {product.img && (
            <img
              src={product.img}
              alt={product.name}
              style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 12 }}
            />
          )}
          {product.description && <p>{product.description}</p>}

          <h3 className="section-title">Thông tin chi tiết</h3>
          {product.detail && <p>{product.detail}</p>}

          {product.origin && (
            <p>
              <strong>Xuất xứ:</strong> {product.origin}
            </p>
          )}
          {product.contact_address && (
            <p>
              <strong>Địa chỉ liên hệ:</strong> {product.contact_address}
            </p>
          )}
          {product.price !== undefined && (
            <p>
              <strong>Giá:</strong> {product.price}
            </p>
          )}
        </div>

        <aside style={{ width: 320 }}>
          <h4>Hình ảnh</h4>
          {imagesData && imagesData.length > 0 ? (
            imagesData.map((it: any, idx: number) => (
              <img
                key={idx}
                src={it.image_url}
                alt={`product-${id}-img-${idx}`}
                style={{ width: "100%", marginBottom: 8, borderRadius: 6 }}
              />
            ))
          ) : (
            <div>Không có hình ảnh.</div>
          )}
        </aside>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href="/products">Quay lại danh sách</Link>
      </div>
    </div>
  )
}
